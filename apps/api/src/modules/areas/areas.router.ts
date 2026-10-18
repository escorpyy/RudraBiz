import { eq, sql } from "drizzle-orm";
import { areaInputSchema, areaUpdateSchema, type AreaRow } from "@ntcas/shared";
import type { Db } from "../../db/client";
import { area, subArea } from "../../db/schema";
import { crudRouter } from "../../http/crud";

/** Area master. An area with sub-areas cannot be deleted (the FK restricts it). */
export function areasRouter(db: Db) {
  return crudRouter<AreaRow>(db, {
    table: area,
    entity: "Area",
    inputSchema: areaInputSchema,
    updateSchema: areaUpdateSchema,
    select: {
      id: area.id,
      code: area.code,
      name: area.name,
      shortName: area.shortName,
      isActive: area.isActive,
      subAreasCount: sql<number>`(select count(*)::int from "SubArea" s where s."areaId" = ${sql.raw('"Area"."id"')})`,
      ledgersCount: sql<number>`(select count(*)::int from "GeneralLedger" g join "SubArea" s on s.id = g."subAreaId" where s."areaId" = ${sql.raw('"Area"."id"')})`,
      partiesCount: sql<number>`(select count(*)::int from "Party" p join "SubArea" s on s.id = p."subAreaId" where s."areaId" = ${sql.raw('"Area"."id"')})`,
    },
    searchColumns: [area.code, area.name, area.shortName],
    orderBy: area.code,
    unique: [
      { constraint: "Area_companyId_code_key", field: "code", message: "An area with that code already exists." },
      { constraint: "Area_companyId_name_key", field: "name", message: "An area with that name already exists." },
      { constraint: "Area_companyId_shortName_key", field: "shortName", message: "An area with that short name already exists." },
    ],
    deleteGuard: async (db, row) => {
      const [c] = await db.select({ n: sql<number>`count(*)::int` }).from(subArea).where(eq(subArea.areaId, row.id));
      return c!.n > 0 ? `Cannot delete: this area has ${c!.n} sub-area(s). Delete or reassign them first.` : null;
    },
  });
}
