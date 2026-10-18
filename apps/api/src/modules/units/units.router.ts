import { sql } from "drizzle-orm";
import { unitInputSchema, unitUpdateSchema, type UnitRow } from "@ntcas/shared";
import type { Db } from "../../db/client";
import { productUnit } from "../../db/schema";
import { crudRouter } from "../../http/crud";

const inUse = sql`(
  (select count(*) from "StockDetail" s where s."baseUnitId" = "ProductUnit"."id") +
  (select count(*) from "NonStockDetail" n where n."unitId" = "ProductUnit"."id") +
  (select count(*) from "AlternateUnit" a where a."unitId" = "ProductUnit"."id")
)::int`;

/** Unit master (table ProductUnit). Stock, non-stock and alternate-unit links restrict delete; service links just un-link. */
export function unitsRouter(db: Db) {
  return crudRouter<UnitRow>(db, {
    table: productUnit,
    entity: "Unit",
    inputSchema: unitInputSchema,
    updateSchema: unitUpdateSchema,
    select: {
      id: productUnit.id,
      code: productUnit.code,
      name: productUnit.name,
      decimalPlaces: productUnit.decimalPlaces,
      isActive: productUnit.isActive,
      inUseCount: sql<number>`${inUse}`,
    },
    searchColumns: [productUnit.code, productUnit.name],
    orderBy: productUnit.code,
    unique: [
      { constraint: "ProductUnit_companyId_code_key", field: "code", message: "A unit with that code already exists." },
      { constraint: "ProductUnit_companyId_name_key", field: "name", message: "A unit with that name already exists." },
    ],
    deleteGuard: async (_db, row) =>
      row.inUseCount > 0 ? `Cannot delete: this unit is used on ${row.inUseCount} product record(s). Reassign them first.` : null,
  });
}
