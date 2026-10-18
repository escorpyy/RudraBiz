import { CheckCircle2, Ruler } from "lucide-react";
import { unitInputSchema, type UnitRow } from "@ntcas/shared";
import type { MasterConfig } from "../../components/master/types";

export const unitsConfig: MasterConfig<UnitRow> = {
  key: "units",
  apiPath: "/api/units",
  basePath: "/master/units",
  singular: "Unit",
  title: "Unit Master",
  subtitle: "Manage units of measure and how many decimals each allows",
  newLabel: "New Unit",
  nameOf: (u) => u.name,
  codeOf: (u) => u.code,

  stats: (rows) => [
    { icon: Ruler, iconBg: "bg-blue-100", iconColor: "text-blue-600", label: "Units", value: rows.length, caption: "Total units" },
    { icon: CheckCircle2, iconBg: "bg-emerald-100", iconColor: "text-emerald-600", label: "Active", value: rows.filter((u) => u.isActive).length, caption: "Currently selectable" },
  ],
  columns: [
    { header: "Code", cell: (u) => u.code, className: "font-medium text-slate-900" },
    { header: "Name", cell: (u) => u.name },
    { header: "Decimals", cell: (u) => u.decimalPlaces },
    { header: "In Use", cell: (u) => <span className="font-medium text-brand">{u.inUseCount}</span> },
  ],
  searchText: (u) => [u.code, u.name],
  deleteMessage: "This permanently deletes the unit. A unit used on product records cannot be deleted. This can't be undone.",

  schema: unitInputSchema,
  fields: [
    { kind: "text", name: "code", label: "Unit Code", hint: "Short code such as PCS or KG.", placeholder: "PCS", icon: Ruler, required: true },
    { kind: "text", name: "name", label: "Unit Name", hint: "Full name of the unit.", placeholder: "Pieces", required: true },
    {
      kind: "select", name: "decimalPlaces", label: "Decimal Places", hint: "How many decimals a quantity may have.", required: true, defaultValue: 0,
      options: [0, 1, 2, 3, 4, 5, 6].map((n) => ({ value: n, label: n === 0 ? "0 (whole numbers)" : String(n) })),
    },
    { kind: "status", label: "Status", hint: "Set active to make this unit selectable." },
  ],

  summary: [
    { label: "Unit Code", value: (u) => u.code },
    { label: "Decimal Places", value: (u) => u.decimalPlaces },
    { label: "In Use", value: (u) => u.inUseCount },
  ],
};
