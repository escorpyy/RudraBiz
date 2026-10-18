import { and, eq, sql } from "drizzle-orm";
import { accountSubGroupInputSchema, accountSubGroupUpdateSchema, type AccountSubGroupRow } from "@ntcas/shared";
import type { Db } from "../../db/client";
import { accountGroup, accountSubGroup } from "../../db/schema";
import { crudRouter } from "../../http/crud";
import { fieldError } from "../../http/errors";

/** Account Sub-Group master. Owned by a company through its Account Group. A sub-group with ledgers cannot be deleted. */
export function accountSubGroupsRouter(db: Db) {
  return crudRouter<AccountSubGroupRow>(db, {
    table: accountSubGroup,
    entity: "Account sub-group",
    inputSchema: accountSubGroupInputSchema,
    updateSchema: accountSubGroupUpdateSchema,
    scope: (ctx) => sql`"AccountSubGroup"."accountGroupId" in (select g.id from "AccountGroup" g where g."companyId" = ${ctx.companyId})`,
    select: {
      id: accountSubGroup.id,
      accountGroupId: accountSubGroup.accountGroupId,
      groupDescription: sql<string>`(select g.description from "AccountGroup" g where g.id = "AccountSubGroup"."accountGroupId")`,
      groupType: sql<AccountSubGroupRow["groupType"]>`(select g.type from "AccountGroup" g where g.id = "AccountSubGroup"."accountGroupId")`,
      code: accountSubGroup.code,
      description: accountSubGroup.description,
      isActive: accountSubGroup.isActive,
      ledgersCount: sql<number>`(select count(*)::int from "GeneralLedger" l where l."accountSubGroupId" = "AccountSubGroup"."id")`,
    },
    searchColumns: [accountSubGroup.code, accountSubGroup.description],
    orderBy: accountSubGroup.code,
    unique: [
      { constraint: "AccountSubGroup_accountGroupId_code_key", field: "code", message: "A sub-group with that code already exists in this group." },
      { constraint: "AccountSubGroup_accountGroupId_description_key", field: "description", message: "A sub-group with that description already exists in this group." },
    ],
    beforeWrite: async (tx, input, ctx) => {
      if (input.accountGroupId === undefined) return;
      const [g] = await tx
        .select({ id: accountGroup.id })
        .from(accountGroup)
        .where(and(eq(accountGroup.id, input.accountGroupId as number), eq(accountGroup.companyId, ctx.companyId)));
      if (!g) throw fieldError("accountGroupId", "Account group not found.");
    },
    deleteGuard: async (_db, row) =>
      row.ledgersCount > 0 ? `Cannot delete: this sub-group has ${row.ledgersCount} ledger(s). Delete or reassign them first.` : null,
  });
}
