import { and, eq, sql } from "drizzle-orm";
import { subAreaInputSchema, subAreaUpdateSchema, type SubAreaRow } from "@ntcas/shared";
import type { Db } from "../../db/client";
import { area, subArea } from "../../db/schema";
import { crudRouter } from "../../http/crud";
import { fieldError } from "../../http/errors";

/**
 * Sub-Area master. SubArea has no companyId: it belongs to a company through its Area, so queries
 * are scoped by the area's company and the area chosen on a write must be one of the company's.
 */
export function subAreasRouter(db: Db) {
  return crudRouter<SubAreaRow>(db, {
    table: subArea,
    entity: "Sub-area",
    inputSchema: subAreaInputSchema,
    updateSchema: subAreaUpdateSchema,
    scope: (ctx) => sql`"SubArea"."areaId" in (select a.id from "Area" a where a."companyId" = ${ctx.companyId})`,
    select: {
      id: subArea.id,
      areaId: subArea.areaId,
      areaName: sql<string>`(select a.name from "Area" a where a.id = "SubArea"."areaId")`,
      code: subArea.code,
      name: subArea.name,
      shortName: subArea.shortName,
      isActive: subArea.isActive,
      ledgersCount: sql<number>`(select count(*)::int from "GeneralLedger" g where g."subAreaId" = "SubArea"."id")`,
      partiesCount: sql<number>`(select count(*)::int from "Party" p where p."subAreaId" = "SubArea"."id")`,
    },
    searchColumns: [subArea.code, subArea.name, subArea.shortName],
    orderBy: subArea.code,
    unique: [
      { constraint: "SubArea_areaId_code_key", field: "code", message: "A sub-area with that code already exists in this area." },
      { constraint: "SubArea_areaId_name_key", field: "name", message: "A sub-area with that name already exists in this area." },
      { constraint: "SubArea_areaId_shortName_key", field: "shortName", message: "A sub-area with that short name already exists in this area." },
    ],
    beforeWrite: async (tx, input, ctx) => {
      if (input.areaId === undefined) return;
      const [a] = await tx.select({ id: area.id }).from(area).where(and(eq(area.id, input.areaId as number), eq(area.companyId, ctx.companyId)));
      if (!a) throw fieldError("areaId", "Area not found.");
    },
    deleteGuard: async (_db, row) =>
      row.ledgersCount + row.partiesCount > 0
        ? `Cannot delete: this sub-area is used by ${row.ledgersCount} ledger(s) and ${row.partiesCount} part${row.partiesCount === 1 ? "y" : "ies"}. Reassign them first.`
        : null,
  });
}
