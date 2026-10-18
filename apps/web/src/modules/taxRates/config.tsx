import { CheckCircle2, Percent } from "lucide-react";
import { taxRateInputSchema, type TaxRateRow } from "@ntcas/shared";
import type { MasterConfig } from "../../components/master/types";

export const taxRatesConfig: MasterConfig<TaxRateRow> = {
  key: "tax-rates",
  apiPath: "/api/tax-rates",
  basePath: "/master/tax-rates",
  singular: "Tax Rate",
  title: "Tax Rate Master",
  subtitle: "Manage tax rates and HSN/SAC codes used on products",
  newLabel: "New Tax Rate",
  nameOf: (t) => t.name,
  codeOf: (t) => t.code,

  stats: (rows) => [
    { icon: Percent, iconBg: "bg-blue-100", iconColor: "text-blue-600", label: "Tax Rates", value: rows.length, caption: "Total tax rates" },
    { icon: CheckCircle2, iconBg: "bg-emerald-100", iconColor: "text-emerald-600", label: "Active", value: rows.filter((t) => t.isActive).length, caption: "Currently selectable" },
  ],
  columns: [
    { header: "Code", cell: (t) => t.code, className: "font-medium text-slate-900" },
    { header: "Name", cell: (t) => t.name },
    { header: "Rate %", cell: (t) => `${t.ratePercent}%` },
    { header: "HSN/SAC", cell: (t) => t.hsnSacCode ?? "-" },
    { header: "In Use", cell: (t) => <span className="font-medium text-brand">{t.inUseCount}</span> },
  ],
  searchText: (t) => [t.code, t.name, t.hsnSacCode ?? ""],
  deleteMessage: "This permanently deletes the tax rate. Products using it lose their tax rate. This can't be undone.",

  schema: taxRateInputSchema,
  fields: [
    { kind: "text", name: "code", label: "Tax Code", hint: "Unique code for this tax rate.", placeholder: "VAT13", icon: Percent, required: true },
    { kind: "text", name: "name", label: "Tax Name", hint: "Name of the tax.", placeholder: "VAT 13%", required: true },
    { kind: "text", name: "ratePercent", label: "Rate", hint: "0 to 100, up to 2 decimals.", placeholder: "13", required: true, inputMode: "decimal", suffix: "%" },
    { kind: "text", name: "hsnSacCode", label: "HSN/SAC Code", hint: "Optional classification code.", placeholder: "9983" },
    { kind: "status", label: "Status", hint: "Set active to make this rate selectable." },
  ],

  summary: [
    { label: "Tax Code", value: (t) => t.code },
    { label: "Rate", value: (t) => `${t.ratePercent}%` },
    { label: "In Use", value: (t) => t.inUseCount },
  ],
};
