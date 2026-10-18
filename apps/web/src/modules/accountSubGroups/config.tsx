import { CheckCircle2, FolderTree } from "lucide-react";
import { accountSubGroupInputSchema, type AccountSubGroupRow } from "@ntcas/shared";
import type { MasterConfig } from "../../components/master/types";
import { AccountTypeBadge } from "../../lib/accountType";

export const accountSubGroupsConfig: MasterConfig<AccountSubGroupRow> = {
  key: "account-sub-groups",
  apiPath: "/api/account-sub-groups",
  basePath: "/master/account-sub-groups",
  singular: "Sub-Group",
  title: "Account Sub-Group Master",
  subtitle: "Manage sub-groups inside each account group",
  newLabel: "New Sub-Group",
  nameOf: (s) => s.description,
  codeOf: (s) => s.code,

  stats: (rows) => [
    { icon: FolderTree, iconBg: "bg-blue-100", iconColor: "text-blue-600", label: "Sub-Groups", value: rows.length, caption: "Total account sub-groups" },
    { icon: CheckCircle2, iconBg: "bg-emerald-100", iconColor: "text-emerald-600", label: "Active", value: rows.filter((s) => s.isActive).length, caption: "Currently selectable" },
  ],
  columns: [
    { header: "Code", cell: (s) => s.code, className: "font-medium text-slate-900" },
    { header: "Description", cell: (s) => s.description },
    { header: "Group", cell: (s) => s.groupDescription },
    { header: "Type", cell: (s) => <AccountTypeBadge type={s.groupType} /> },
    { header: "Ledgers", cell: (s) => <span className="font-medium text-brand">{s.ledgersCount}</span> },
  ],
  searchText: (s) => [s.code, s.description, s.groupDescription],
  deleteMessage: "This permanently deletes the sub-group. A sub-group that still has ledgers cannot be deleted. This can't be undone.",

  schema: accountSubGroupInputSchema,
  fields: [
    {
      kind: "select", name: "accountGroupId", label: "Account Group", hint: "The group this sub-group belongs to.", required: true, icon: FolderTree,
      emptyLabel: "Select a group", options: { from: { key: "account-groups", apiPath: "/api/account-groups", label: (g) => `${g.code} - ${g.description}` } },
    },
    { kind: "text", name: "code", label: "Sub-Group Code", hint: "Unique within the group.", placeholder: "1100", required: true },
    { kind: "text", name: "description", label: "Description", hint: "Name of the sub-group.", placeholder: "Cash and Bank", required: true },
    { kind: "status", label: "Status", hint: "Set active to make this sub-group selectable." },
  ],

  summary: [
    { label: "Group", value: (s) => s.groupDescription },
    { label: "Type", value: (s) => <AccountTypeBadge type={s.groupType} /> },
    { label: "Sub-Group Code", value: (s) => s.code },
    { label: "Ledgers", value: (s) => s.ledgersCount },
  ],
};
