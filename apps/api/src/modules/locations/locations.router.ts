import { and, eq, sql } from "drizzle-orm";
import { locationInputSchema, locationUpdateSchema, type LocationRow } from "@ntcas/shared";
import type { Db } from "../../db/client";
import { location } from "../../db/schema";
import { crudRouter } from "../../http/crud";
import { fieldError } from "../../http/errors";

/**
 * Location master: a company-wide tree (parentId points at another Location).
 * The parent must be in the same company and not the location itself or one of its descendants.
 * A location with child locations cannot be deleted.
 */
export function locationsRouter(db: Db) {
  return crudRouter<LocationRow>(db, {
    table: location,
    entity: "Location",
    inputSchema: locationInputSchema,
    updateSchema: locationUpdateSchema,
    select: {
      id: location.id,
      code: location.code,
      name: location.name,
      parentId: location.parentId,
      parentName: sql<string | null>`(select p.name from "Location" p where p.id = "Location"."parentId")`,
      isActive: location.isActive,
      childrenCount: sql<number>`(select count(*)::int from "Location" c where c."parentId" = "Location"."id")`,
      usageCount: sql<number>`(
        (select count(*) from "FixedAssetDetail" f where f."locationId" = "Location"."id") +
        (select count(*) from "StockOpeningBalance" o where o."locationId" = "Location"."id")
      )::int`,
    },
    searchColumns: [location.code, location.name],
    orderBy: location.code,
    unique: [{ constraint: "Location_companyId_code_key", field: "code", message: "A location with that code already exists." }],
    beforeWrite: async (tx, input, ctx, id) => {
      const parentId = input.parentId as number | null | undefined;
      if (parentId == null) return;
      if (id !== undefined && parentId === id) throw fieldError("parentId", "A location can't be its own parent.");
      const [parent] = await tx
        .select({ id: location.id })
        .from(location)
        .where(and(eq(location.id, parentId), eq(location.companyId, ctx.companyId)));
      if (!parent) throw fieldError("parentId", "Parent location not found.");
      if (id === undefined) return;
      // walking up from the new parent must never reach this location
      const r = await tx.execute(sql`
        with recursive up(id) as (
          select ${parentId}::int
          union all
          select l."parentId" from "Location" l join up on l.id = up.id where l."parentId" is not null
        ) select 1 from up where id = ${id} limit 1`);
      if (r.rows.length) throw fieldError("parentId", "A location can't sit under one of its own sub-locations.");
    },
    deleteGuard: async (_db, row) =>
      row.childrenCount > 0 ? `Cannot delete: this location has ${row.childrenCount} child location(s). Delete or reassign them first.` : null,
  });
}
