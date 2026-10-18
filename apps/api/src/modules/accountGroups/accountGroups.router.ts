import { sql } from "drizzle-orm";
import { accountGroupInputSchema, accountGroupUpdateSchema, type AccountGroupRow } from "@ntcas/shared";
import type { Db } from "../../db/client";
import { accountGroup } from "../../db/schema";
import { crudRouter } from "../../http/crud";

/** Account Group master (Asset / Liability / Equity / Revenue / Expense). A group with sub-groups cannot be deleted. */
export function accountGroupsRouter(db: Db) {
  return crudRouter<AccountGroupRow>(db, {
    table: accountGroup,
    entity: "Account group",
    inputSchema: accountGroupInputSchema,
    updateSchema: accountGroupUpdateSchema,
    select: {
      id: accountGroup.id,
      type: accountGroup.type,
      code: accountGroup.code,
      description: accountGroup.description,
      isActive: accountGroup.isActive,
      subGroupsCount: sql<number>`(select count(*)::int from "AccountSubGroup" s where s."accountGroupId" = "AccountGroup"."id")`,
      ledgersCount: sql<number>`(select count(*)::int from "GeneralLedger" g join "AccountSubGroup" s on s.id = g."accountSubGroupId" where s."accountGroupId" = "AccountGroup"."id")`,
    },
    searchColumns: [accountGroup.code, accountGroup.description],
    orderBy: accountGroup.code,
    unique: [
      { constraint: "AccountGroup_companyId_code_key", field: "code", message: "A group with that code already exists." },
      { constraint: "AccountGroup_companyId_description_key", field: "description", message: "A group with that description already exists." },
    ],
    deleteGuard: async (_db, row) =>
      row.subGroupsCount > 0 ? `Cannot delete: this group has ${row.subGroupsCount} sub-group(s). Delete or reassign them first.` : null,
  });
}
