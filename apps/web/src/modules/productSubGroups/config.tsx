import { CheckCircle2, Layers } from "lucide-react";
import { productSubGroupInputSchema, type ProductSubGroupRow } from "@ntcas/shared";
import type { MasterConfig } from "../../components/master/types";

export const productSubGroupsConfig: MasterConfig<ProductSubGroupRow> = {
  key: "product-sub-groups",
  apiPath: "/api/product-sub-groups",
  basePath: "/master/product-sub-groups",
  singular: "Sub-Group",
  title: "Product Sub-Group Master",
  subtitle: "Manage sub-groups inside each product group",
  newLabel: "New Sub-Group",
  nameOf: (s) => s.name,
  codeOf: (s) => s.code,

  stats: (rows) => [
    { icon: Layers, iconBg: "bg-blue-100", iconColor: "text-blue-600", label: "Sub-Groups", value: rows.length, caption: "Total product sub-groups" },
    { icon: CheckCircle2, iconBg: "bg-emerald-100", iconColor: "text-emerald-600", label: "Active", value: rows.filter((s) => s.isActive).length, caption: "Currently selectable" },
  ],
  columns: [
    { header: "Code", cell: (s) => s.code, className: "font-medium text-slate-900" },
    { header: "Name", cell: (s) => s.name },
    { header: "Group", cell: (s) => s.groupName },
    { header: "Products", cell: (s) => <span className="font-medium text-brand">{s.productsCount}</span> },
  ],
  searchText: (s) => [s.code, s.name, s.groupName],
  deleteMessage: "This permanently deletes the sub-group. A sub-group that still has products cannot be deleted. This can't be undone.",

  schema: productSubGroupInputSchema,
  fields: [
    {
      kind: "select", name: "productGroupId", label: "Product Group", hint: "The group this sub-group belongs to.", required: true, icon: Layers,
      emptyLabel: "Select a group", options: { from: { key: "product-groups", apiPath: "/api/product-groups", label: (g) => `${g.code} - ${g.name}` } },
    },
    { kind: "text", name: "code", label: "Sub-Group Code", hint: "Unique within the group.", placeholder: "SG-01", required: true },
    { kind: "text", name: "name", label: "Sub-Group Name", hint: "Name of the sub-group.", placeholder: "Fasteners", required: true },
    { kind: "status", label: "Status", hint: "Set active to make this sub-group selectable." },
  ],

  summary: [
    { label: "Group", value: (s) => s.groupName },
    { label: "Sub-Group Code", value: (s) => s.code },
    { label: "Products", value: (s) => s.productsCount },
  ],
};
