import { CheckCircle2, FolderTree } from "lucide-react";
import { accountGroupInputSchema, type AccountGroupRow } from "@ntcas/shared";
import type { MasterConfig } from "../../components/master/types";
import { ACCOUNT_TYPE_OPTIONS, ACCOUNT_TYPE_STYLES, AccountTypeBadge } from "../../lib/accountType";

export const accountGroupsConfig: MasterConfig<AccountGroupRow> = {
  key: "account-groups",
  apiPath: "/api/account-groups",
  basePath: "/master/account-groups",
  singular: "Account Group",
  title: "Account Group Master",
  subtitle: "Manage the top level of the chart of accounts",
  newLabel: "New Account Group",
  nameOf: (g) => g.description,
  codeOf: (g) => g.code,

  stats: (rows) => [
    { icon: FolderTree, iconBg: "bg-blue-100", iconColor: "text-blue-600", label: "Groups", value: rows.length, caption: "Total account groups" },
    { icon: CheckCircle2, iconBg: "bg-emerald-100", iconColor: "text-emerald-600", label: "Active", value: rows.filter((g) => g.isActive).length, caption: "Currently selectable" },
  ],
  columns: [
    { header: "Code", cell: (g) => g.code, className: "font-medium text-slate-900" },
    { header: "Description", cell: (g) => g.description },
    { header: "Type", cell: (g) => <AccountTypeBadge type={g.type} /> },
    { header: "Sub-groups", cell: (g) => g.subGroupsCount },
    { header: "Ledgers", cell: (g) => <span className="font-medium text-brand">{g.ledgersCount}</span> },
  ],
  searchText: (g) => [g.code, g.description, ACCOUNT_TYPE_STYLES[g.type].label],
  deleteMessage: "This permanently deletes the account group. A group that still has sub-groups cannot be deleted. This can't be undone.",

  schema: accountGroupInputSchema,
  fields: [
    { kind: "select", name: "type", label: "Account Type", hint: "The type of account this group holds.", required: true, emptyLabel: "Select a type", options: ACCOUNT_TYPE_OPTIONS },
    { kind: "text", name: "code", label: "Group Code", hint: "Unique code for this group.", placeholder: "1000", icon: FolderTree, required: true },
    { kind: "text", name: "description", label: "Description", hint: "Name of the account group.", placeholder: "Current Assets", required: true },
    { kind: "status", label: "Status", hint: "Set active to make this group selectable." },
  ],

  summary: [
    { label: "Group Code", value: (g) => g.code },
    { label: "Type", value: (g) => <AccountTypeBadge type={g.type} /> },
    { label: "Sub-groups", value: (g) => g.subGroupsCount },
    { label: "Ledgers", value: (g) => g.ledgersCount },
  ],
};
