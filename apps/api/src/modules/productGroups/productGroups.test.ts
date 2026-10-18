import { productGroupInputSchema } from "@ntcas/shared";
import { expect, it } from "vitest";
import { inArray, sql } from "drizzle-orm";
import { productGroup, productSubGroup } from "../../db/schema";
import { describeCrud, describeSchemaDrift } from "../../test/crudSuite";

describeSchemaDrift(
  "product group",
  productGroup,
  productGroupInputSchema,
  { code: "A", name: "N" },
  [["code", 10], ["name", 50]],
  { companyId: 1, updatedAt: "2026-01-01", code: "A", name: "N" },
);

describeCrud({
  title: "product groups",
  path: "/api/product-groups",
  table: productGroup,
  make: (n, over = {}) => ({ code: `PG-${n}`, name: `Product group ${n}`, ...over }),
  invalid: { body: { code: "", name: "x".repeat(51) }, fields: ["code", "name"] },
  unique: [
    { field: "code", clash: (e) => ({ code: e.code }), message: "A product group with that code already exists." },
    { field: "name", clash: (e) => ({ name: e.name }), message: "A product group with that name already exists." },
  ],
  searchOf: (r) => String(r.name),
  update: (n) => ({ body: { name: `Renamed group ${n}` }, expect: { name: `Renamed group ${n}` } }),
  extra: ({ h, create }) => {
    it("refuses to delete a group that has sub-groups, then allows it once they are gone", async () => {
      h().onClose(async (companyIds) => {
        const ids = (await h().db.select({ id: productGroup.id }).from(productGroup).where(inArray(productGroup.companyId, companyIds))).map((r) => r.id);
        if (ids.length) await h().db.delete(productSubGroup).where(inArray(productSubGroup.productGroupId, ids));
      });
      const g = await create({ code: "PGD-1", name: "Group with children" });
      const [sg] = await h().db
        .insert(productSubGroup)
        .values({ code: "S1", name: "Sub 1", productGroupId: g.id, updatedAt: sql`CURRENT_TIMESTAMP` as never })
        .returning({ id: productSubGroup.id });

      const blocked = await h().as("admin").delete(`/api/product-groups/${g.id}`);
      expect(blocked.status).toBe(409);
      expect(blocked.body.error.message).toBe("Cannot delete: this group has 1 sub-group(s). Delete or reassign them first.");

      const listed = (await h().as("admin").get(`/api/product-groups/${g.id}`)).body;
      expect(listed.subGroupsCount).toBe(1);

      await h().db.delete(productSubGroup).where(sql`id = ${sg!.id}`);
      expect((await h().as("admin").delete(`/api/product-groups/${g.id}`)).status).toBe(204);
    });
  },
});
