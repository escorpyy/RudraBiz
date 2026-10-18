import { taxRateInputSchema } from "@ntcas/shared";
import { expect, it } from "vitest";
import { taxRate } from "../../db/schema";
import { describeCrud, describeSchemaDrift } from "../../test/crudSuite";

describeSchemaDrift(
  "tax rate",
  taxRate,
  taxRateInputSchema,
  { code: "A", name: "N", ratePercent: "13" },
  [["code", 10], ["name", 50], ["hsnSacCode", 20]],
  { companyId: 1, updatedAt: "2026-01-01", code: "A", name: "N", ratePercent: "13" },
);

describeCrud({
  title: "tax rates",
  path: "/api/tax-rates",
  table: taxRate,
  make: (n, over = {}) => ({ code: `T-${n}`, name: `Tax ${n}`, ratePercent: "13.00", ...over }),
  invalid: { body: { code: "", name: "x".repeat(51), ratePercent: "abc" }, fields: ["code", "name", "ratePercent"] },
  unique: [{ field: "code", clash: (e) => ({ code: e.code }), message: "A tax rate with that code already exists." }],
  searchOf: (r) => String(r.name),
  update: (n) => ({ body: { name: `Renamed tax ${n}` }, expect: { name: `Renamed tax ${n}` } }),
  extra: ({ h, create }) => {
    it("keeps the rate a string with 2 decimals and accepts the 0 to 100 bounds", async () => {
      const a = await create({ code: "TD-1", name: "Tax dec 1", ratePercent: "13.5" });
      expect(a.ratePercent).toBe("13.50");
      expect((await create({ code: "TD-2", name: "Tax dec 2", ratePercent: "0" })).ratePercent).toBe("0.00");
      expect((await create({ code: "TD-3", name: "Tax dec 3", ratePercent: "100" })).ratePercent).toBe("100.00");
    });

    it.each(["abc", "101", "-1", "13.555", "", 13, 13.5])("rejects ratePercent %j", async (bad) => {
      const res = await h().as("admin").post("/api/tax-rates", { code: "TX", name: "Tax bad", ratePercent: bad });
      expect(res.status).toBe(400);
      expect(res.body.error.details.fieldErrors.ratePercent).toBeDefined();
    });

    it("reports zero products in use for a fresh rate", async () => {
      const a = await create({ code: "TU-1", name: "Tax use 1", ratePercent: "5" });
      expect(a.inUseCount).toBe(0);
    });
  },
});
