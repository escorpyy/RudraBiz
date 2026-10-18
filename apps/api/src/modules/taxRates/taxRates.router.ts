import { sql } from "drizzle-orm";
import { taxRateInputSchema, taxRateUpdateSchema, type TaxRateRow } from "@ntcas/shared";
import type { Db } from "../../db/client";
import { taxRate } from "../../db/schema";
import { crudRouter } from "../../http/crud";

/** Tax Rate master. ratePercent is NUMERIC(5,2) and travels as a string; deleting a rate un-links it from products (FK sets taxRateId to NULL). */
export function taxRatesRouter(db: Db) {
  return crudRouter<TaxRateRow>(db, {
    table: taxRate,
    entity: "Tax rate",
    inputSchema: taxRateInputSchema,
    updateSchema: taxRateUpdateSchema,
    select: {
      id: taxRate.id,
      code: taxRate.code,
      name: taxRate.name,
      ratePercent: taxRate.ratePercent,
      hsnSacCode: taxRate.hsnSacCode,
      isActive: taxRate.isActive,
      inUseCount: sql<number>`(
        (select count(*) from "StockDetail" s where s."taxRateId" = ${sql.raw('"TaxRate"."id"')}) +
        (select count(*) from "NonStockDetail" n where n."taxRateId" = ${sql.raw('"TaxRate"."id"')}) +
        (select count(*) from "ServiceDetail" v where v."taxRateId" = ${sql.raw('"TaxRate"."id"')})
      )::int`,
    },
    searchColumns: [taxRate.code, taxRate.name, taxRate.hsnSacCode],
    orderBy: taxRate.code,
    unique: [{ constraint: "TaxRate_companyId_code_key", field: "code", message: "A tax rate with that code already exists." }],
  });
}
