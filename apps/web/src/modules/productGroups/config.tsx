import { CheckCircle2, Layers } from "lucide-react";
import { productGroupInputSchema, type ProductGroupRow } from "@ntcas/shared";
import type { MasterConfig } from "../../components/master/types";

export const productGroupsConfig: MasterConfig<ProductGroupRow> = {
  key: "product-groups",
  apiPath: "/api/product-groups",
  basePath: "/master/product-groups",
  singular: "Group",
  title: "Product Group Master",
  subtitle: "Manage top-level product groups",
  newLabel: "New Group",
  nameOf: (g) => g.name,
  codeOf: (g) => g.code,

  stats: (rows) => [
    { icon: Layers, iconBg: "bg-blue-100", iconColor: "text-blue-600", label: "Groups", value: rows.length, caption: "Total product groups" },
    { icon: CheckCircle2, iconBg: "bg-emerald-100", iconColor: "text-emerald-600", label: "Active", value: rows.filter((g) => g.isActive).length, caption: "Currently selectable" },
  ],
  columns: [
    { header: "Code", cell: (g) => g.code, className: "font-medium text-slate-900" },
    { header: "Name", cell: (g) => g.name },
    { header: "Sub-groups", cell: (g) => g.subGroupsCount },
    { header: "Products", cell: (g) => <span className="font-medium text-brand">{g.productsCount}</span> },
  ],
  searchText: (g) => [g.code, g.name],
  deleteMessage: "This permanently deletes the group. A group that still has sub-groups cannot be deleted. This can't be undone.",

  schema: productGroupInputSchema,
  fields: [
    { kind: "text", name: "code", label: "Group Code", hint: "Unique code for this group.", placeholder: "GRP-01", icon: Layers, required: true },
    { kind: "text", name: "name", label: "Group Name", hint: "Name of the product group.", placeholder: "Hardware", required: true },
    { kind: "status", label: "Status", hint: "Set active to make this group selectable." },
  ],

  summary: [
    { label: "Group Code", value: (g) => g.code },
    { label: "Sub-groups", value: (g) => g.subGroupsCount },
    { label: "Products", value: (g) => g.productsCount },
  ],
};
