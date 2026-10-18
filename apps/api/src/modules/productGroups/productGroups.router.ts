import { eq, sql } from "drizzle-orm";
import { productGroupInputSchema, productGroupUpdateSchema, type ProductGroupRow } from "@ntcas/shared";
import type { Db } from "../../db/client";
import { productGroup, productSubGroup } from "../../db/schema";
import { crudRouter } from "../../http/crud";

/** Product Group master. A group with sub-groups cannot be deleted (the FK restricts it). */
export function productGroupsRouter(db: Db) {
  return crudRouter<ProductGroupRow>(db, {
    table: productGroup,
    entity: "Product group",
    inputSchema: productGroupInputSchema,
    updateSchema: productGroupUpdateSchema,
    select: {
      id: productGroup.id,
      code: productGroup.code,
      name: productGroup.name,
      isActive: productGroup.isActive,
      subGroupsCount: sql<number>`(select count(*)::int from "ProductSubGroup" sg where sg."productGroupId" = ${sql.raw('"ProductGroup"."id"')})`,
      productsCount: sql<number>`(select count(*)::int from "Product" p join "ProductSubGroup" sg on sg.id = p."productSubGroupId" where sg."productGroupId" = ${sql.raw('"ProductGroup"."id"')})`,
    },
    searchColumns: [productGroup.code, productGroup.name],
    orderBy: productGroup.code,
    unique: [
      { constraint: "ProductGroup_companyId_code_key", field: "code", message: "A product group with that code already exists." },
      { constraint: "ProductGroup_companyId_name_key", field: "name", message: "A product group with that name already exists." },
    ],
    deleteGuard: async (db, row) => {
      const [c] = await db.select({ n: sql<number>`count(*)::int` }).from(productSubGroup).where(eq(productSubGroup.productGroupId, row.id));
      return c!.n > 0 ? `Cannot delete: this group has ${c!.n} sub-group(s). Delete or reassign them first.` : null;
    },
  });
}
