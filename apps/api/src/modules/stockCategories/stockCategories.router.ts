import { sql } from "drizzle-orm";
import { stockCategoryInputSchema, stockCategoryUpdateSchema, type StockCategoryRow } from "@ntcas/shared";
import type { Db } from "../../db/client";
import { stockCategory } from "../../db/schema";
import { crudRouter } from "../../http/crud";

/** Stock Category master. Deleting a category leaves its products uncategorised (FK sets stockCategoryId to NULL). */
export function stockCategoriesRouter(db: Db) {
  return crudRouter<StockCategoryRow>(db, {
    table: stockCategory,
    entity: "Stock category",
    inputSchema: stockCategoryInputSchema,
    updateSchema: stockCategoryUpdateSchema,
    select: {
      id: stockCategory.id,
      code: stockCategory.code,
      name: stockCategory.name,
      isActive: stockCategory.isActive,
      productCount: sql<number>`(select count(*)::int from "StockDetail" s where s."stockCategoryId" = ${stockCategory.id})`,
    },
    searchColumns: [stockCategory.code, stockCategory.name],
    orderBy: stockCategory.code,
    unique: [
      { constraint: "StockCategory_companyId_code_key", field: "code", message: "A stock category with that code already exists." },
      { constraint: "StockCategory_companyId_name_key", field: "name", message: "A stock category with that name already exists." },
    ],
  });
}
