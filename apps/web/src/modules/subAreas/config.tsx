import { CheckCircle2, MapPin } from "lucide-react";
import { subAreaInputSchema, type SubAreaRow } from "@ntcas/shared";
import type { MasterConfig } from "../../components/master/types";

export const subAreasConfig: MasterConfig<SubAreaRow> = {
  key: "sub-areas",
  apiPath: "/api/sub-areas",
  basePath: "/master/sub-areas",
  singular: "Sub-Area",
  title: "Sub-Area Master",
  subtitle: "Manage sub-areas inside each area",
  newLabel: "New Sub-Area",
  nameOf: (s) => s.name,
  codeOf: (s) => s.code,

  stats: (rows) => [
    { icon: MapPin, iconBg: "bg-blue-100", iconColor: "text-blue-600", label: "Sub-Areas", value: rows.length, caption: "Total sub-areas" },
    { icon: CheckCircle2, iconBg: "bg-emerald-100", iconColor: "text-emerald-600", label: "Active", value: rows.filter((s) => s.isActive).length, caption: "Currently selectable" },
  ],
  columns: [
    { header: "Code", cell: (s) => s.code, className: "font-medium text-slate-900" },
    { header: "Name", cell: (s) => s.name },
    { header: "Short Name", cell: (s) => s.shortName },
    { header: "Area", cell: (s) => s.areaName },
    { header: "Ledgers", cell: (s) => s.ledgersCount },
    { header: "Parties", cell: (s) => <span className="font-medium text-brand">{s.partiesCount}</span> },
  ],
  searchText: (s) => [s.code, s.name, s.shortName, s.areaName],
  deleteMessage: "This permanently deletes the sub-area. A sub-area used by ledgers or parties cannot be deleted. This can't be undone.",

  schema: subAreaInputSchema,
  fields: [
    {
      kind: "select", name: "areaId", label: "Area", hint: "The area this sub-area belongs to.", required: true, icon: MapPin,
      emptyLabel: "Select an area", options: { from: { key: "areas", apiPath: "/api/areas", label: (a) => `${a.code} - ${a.name}` } },
    },
    { kind: "text", name: "code", label: "Sub-Area Code", hint: "Unique within the area.", placeholder: "SA-01", required: true },
    { kind: "text", name: "name", label: "Sub-Area Name", hint: "Full name of the sub-area.", placeholder: "Thamel", required: true },
    { kind: "text", name: "shortName", label: "Short Name", hint: "Up to 10 characters.", placeholder: "THM", required: true },
    { kind: "status", label: "Status", hint: "Set active to make this sub-area selectable." },
  ],

  summary: [
    { label: "Area", value: (s) => s.areaName },
    { label: "Sub-Area Code", value: (s) => s.code },
    { label: "Short Name", value: (s) => s.shortName },
  ],
};
