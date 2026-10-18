import { CheckCircle2, MapPin } from "lucide-react";
import { areaInputSchema, type AreaRow } from "@ntcas/shared";
import type { MasterConfig } from "../../components/master/types";

export const areasConfig: MasterConfig<AreaRow> = {
  key: "areas",
  apiPath: "/api/areas",
  basePath: "/master/areas",
  singular: "Area",
  title: "Area Master",
  subtitle: "Manage areas used to organise ledgers and parties",
  newLabel: "New Area",
  nameOf: (a) => a.name,
  codeOf: (a) => a.code,

  stats: (rows) => [
    { icon: MapPin, iconBg: "bg-blue-100", iconColor: "text-blue-600", label: "Areas", value: rows.length, caption: "Total areas" },
    { icon: CheckCircle2, iconBg: "bg-emerald-100", iconColor: "text-emerald-600", label: "Active", value: rows.filter((a) => a.isActive).length, caption: "Currently selectable" },
  ],
  columns: [
    { header: "Code", cell: (a) => a.code, className: "font-medium text-slate-900" },
    { header: "Name", cell: (a) => a.name },
    { header: "Short Name", cell: (a) => a.shortName },
    { header: "Sub-areas", cell: (a) => a.subAreasCount },
    { header: "Ledgers", cell: (a) => a.ledgersCount },
    { header: "Parties", cell: (a) => <span className="font-medium text-brand">{a.partiesCount}</span> },
  ],
  searchText: (a) => [a.code, a.name, a.shortName],
  deleteMessage: "This permanently deletes the area. An area that still has sub-areas cannot be deleted. This can't be undone.",

  schema: areaInputSchema,
  fields: [
    { kind: "text", name: "code", label: "Area Code", hint: "Unique code for this area.", placeholder: "AR-01", icon: MapPin, required: true },
    { kind: "text", name: "name", label: "Area Name", hint: "Full name of the area.", placeholder: "Kathmandu", required: true },
    { kind: "text", name: "shortName", label: "Short Name", hint: "Up to 10 characters.", placeholder: "KTM", required: true },
    { kind: "status", label: "Status", hint: "Set active to make this area selectable." },
  ],

  summary: [
    { label: "Area Code", value: (a) => a.code },
    { label: "Short Name", value: (a) => a.shortName },
    { label: "Sub-areas", value: (a) => a.subAreasCount },
  ],
};
