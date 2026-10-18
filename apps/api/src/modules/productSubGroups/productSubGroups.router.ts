import { and, eq, sql } from "drizzle-orm";
import { productSubGroupInputSchema, productSubGroupUpdateSchema, type ProductSubGroupRow } from "@ntcas/shared";
import type { Db } from "../../db/client";
import { productGroup, productSubGroup } from "../../db/schema";
import { crudRouter } from "../../http/crud";
import { fieldError } from "../../http/errors";

/** Product Sub-Group master. Owned by a company through its Product Group (no companyId of its own). */
export function productSubGroupsRouter(db: Db) {
  return crudRouter<ProductSubGroupRow>(db, {
    table: productSubGroup,
    entity: "Product sub-group",
    inputSchema: productSubGroupInputSchema,
    updateSchema: productSubGroupUpdateSchema,
    scope: (ctx) => sql`"ProductSubGroup"."productGroupId" in (select g.id from "ProductGroup" g where g."companyId" = ${ctx.companyId})`,
    select: {
      id: productSubGroup.id,
      productGroupId: productSubGroup.productGroupId,
      groupName: sql<string>`(select g.name from "ProductGroup" g where g.id = "ProductSubGroup"."productGroupId")`,
      code: productSubGroup.code,
      name: productSubGroup.name,
      isActive: productSubGroup.isActive,
      productsCount: sql<number>`(select count(*)::int from "Product" p where p."productSubGroupId" = "ProductSubGroup"."id")`,
    },
    searchColumns: [productSubGroup.code, productSubGroup.name],
    orderBy: productSubGroup.code,
    unique: [
      { constraint: "ProductSubGroup_productGroupId_code_key", field: "code", message: "A sub-group with that code already exists in this group." },
      { constraint: "ProductSubGroup_productGroupId_name_key", field: "name", message: "A sub-group with that name already exists in this group." },
    ],
    beforeWrite: async (tx, input, ctx) => {
      if (input.productGroupId === undefined) return;
      const [g] = await tx
        .select({ id: productGroup.id })
        .from(productGroup)
        .where(and(eq(productGroup.id, input.productGroupId as number), eq(productGroup.companyId, ctx.companyId)));
      if (!g) throw fieldError("productGroupId", "Product group not found.");
    },
    deleteGuard: async (_db, row) =>
      row.productsCount > 0 ? `Cannot delete: this sub-group has ${row.productsCount} product(s). Delete or reassign them first.` : null,
  });
}
