import { unitInputSchema } from "@ntcas/shared";
import { expect, it } from "vitest";
import { productUnit } from "../../db/schema";
import { describeCrud, describeSchemaDrift } from "../../test/crudSuite";

describeSchemaDrift(
  "unit",
  productUnit,
  unitInputSchema,
  { code: "A", name: "N" },
  [["code", 10], ["name", 50]],
  { companyId: 1, updatedAt: "2026-01-01", code: "A", name: "N" },
);

describeCrud({
  title: "units",
  path: "/api/units",
  table: productUnit,
  make: (n, over = {}) => ({ code: `U-${n}`, name: `Unit ${n}`, decimalPlaces: 2, ...over }),
  invalid: { body: { code: "", name: "x".repeat(51), decimalPlaces: 9 }, fields: ["code", "name", "decimalPlaces"] },
  unique: [
    { field: "code", clash: (e) => ({ code: e.code }), message: "A unit with that code already exists." },
    { field: "name", clash: (e) => ({ name: e.name }), message: "A unit with that name already exists." },
  ],
  searchOf: (r) => String(r.name),
  update: (n) => ({ body: { name: `Renamed unit ${n}`, decimalPlaces: 3 }, expect: { name: `Renamed unit ${n}`, decimalPlaces: 3 } }),
  extra: ({ h, create }) => {
    it("defaults decimalPlaces to 0 and accepts the 0 and 6 bounds", async () => {
      expect((await create({ code: "UD-1", name: "Unit default" })).decimalPlaces).toBe(0);
      expect((await create({ code: "UD-2", name: "Unit six", decimalPlaces: 6 })).decimalPlaces).toBe(6);
    });

    it.each([7, -1, 1.5, "2", null])("rejects decimalPlaces %j", async (bad) => {
      const res = await h().as("admin").post("/api/units", { code: "UX", name: "Unit bad", decimalPlaces: bad });
      expect(res.status).toBe(400);
      expect(res.body.error.details.fieldErrors.decimalPlaces).toBeDefined();
    });

    it("reports a fresh unit as not in use", async () => {
      expect((await create({ code: "UU-1", name: "Unit unused" })).inUseCount).toBe(0);
    });
  },
});
