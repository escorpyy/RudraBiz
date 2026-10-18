import { productSubGroupInputSchema } from "@ntcas/shared";
import { expect, it } from "vitest";
import { productGroup, productSubGroup } from "../../db/schema";
import { describeCrud, describeSchemaDrift } from "../../test/crudSuite";

describeSchemaDrift(
  "product sub-group",
  productSubGroup,
  productSubGroupInputSchema,
  { productGroupId: 1, code: "A", name: "N" },
  [["code", 10], ["name", 50]],
  { productGroupId: 1, updatedAt: "2026-01-01", code: "A", name: "N" },
);

describeCrud({
  title: "product sub-groups",
  path: "/api/product-sub-groups",
  table: productSubGroup,
  parent: { path: "/api/product-groups", table: productGroup, field: "productGroupId", make: (n) => ({ code: `PG-${n}`, name: `Parent group ${n}` }) },
  make: (n, over = {}) => ({ code: `SG-${n}`, name: `Sub-group ${n}`, ...over }),
  invalid: { body: { code: "", name: "x".repeat(51) }, fields: ["code", "name"] },
  unique: [
    { field: "code", clash: (e) => ({ code: e.code }), message: "A sub-group with that code already exists in this group." },
    { field: "name", clash: (e) => ({ name: e.name }), message: "A sub-group with that name already exists in this group." },
  ],
  searchOf: (r) => String(r.name),
  update: (n) => ({ body: { name: `Renamed sub-group ${n}` }, expect: { name: `Renamed sub-group ${n}` } }),
  extra: ({ h, create, parents }) => {
    it("shows the group name and the group's counts follow", async () => {
      const s = await create({ code: "SGX-1", name: "Sub group X1" });
      expect(s).toMatchObject({ productGroupId: parents().A.id, groupName: parents().A.name, productsCount: 0 });
      const g = (await h().as("admin").get(`/api/product-groups/${parents().A.id}`)).body;
      expect(g.subGroupsCount).toBeGreaterThanOrEqual(1);
    });

    it("rejects a group that is missing or belongs to another company, on the productGroupId field", async () => {
      for (const productGroupId of [999999999, parents().B.id]) {
        const res = await h().as("admin").post("/api/product-sub-groups", { productGroupId, code: "SGY-1", name: "Sub group Y1" });
        expect(res.status).toBe(400);
        expect(res.body.error.details.fieldErrors.productGroupId).toEqual(["Product group not found."]);
      }
    });
  },
});
