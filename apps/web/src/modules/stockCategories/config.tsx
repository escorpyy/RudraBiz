import { CheckCircle2, Tags } from "lucide-react";
import { stockCategoryInputSchema, type StockCategoryRow } from "@ntcas/shared";
import type { MasterConfig } from "../../components/master/types";

export const stockCategoriesConfig: MasterConfig<StockCategoryRow> = {
  key: "stock-categories",
  apiPath: "/api/stock-categories",
  basePath: "/master/stock-categories",
  singular: "Category",
  title: "Stock Category Master",
  subtitle: "Manage stock categories used to group Stock products",
  newLabel: "New Category",
  nameOf: (c) => c.name,
  codeOf: (c) => c.code,

  stats: (rows) => [
    { icon: Tags, iconBg: "bg-blue-100", iconColor: "text-blue-600", label: "Categories", value: rows.length, caption: "Total stock categories" },
    { icon: CheckCircle2, iconBg: "bg-emerald-100", iconColor: "text-emerald-600", label: "Active", value: rows.filter((c) => c.isActive).length, caption: "Currently selectable" },
  ],
  columns: [
    { header: "Code", cell: (c) => c.code, className: "font-medium text-slate-900" },
    { header: "Name", cell: (c) => c.name },
    { header: "Products", cell: (c) => <span className="font-medium text-brand">{c.productCount}</span> },
  ],
  searchText: (c) => [c.code, c.name],
  deleteMessage: "This permanently deletes the category. Stock products in it become uncategorised. This can't be undone.",

  schema: stockCategoryInputSchema,
  fields: [
    { kind: "text", name: "code", label: "Category Code", hint: "Unique code for this category.", placeholder: "CAT-01", icon: Tags, required: true },
    { kind: "text", name: "name", label: "Category Name", hint: "Name of the stock category.", placeholder: "Building Materials", required: true },
    { kind: "status", label: "Status", hint: "Set active to make this category selectable." },
  ],

  summary: [
    { label: "Category Code", value: (c) => c.code },
    { label: "Products", value: (c) => c.productCount },
  ],
};
