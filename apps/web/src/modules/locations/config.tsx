import { CheckCircle2, MapPinned } from "lucide-react";
import { locationInputSchema, type LocationRow } from "@ntcas/shared";
import type { MasterConfig } from "../../components/master/types";

export const locationsConfig: MasterConfig<LocationRow> = {
  key: "locations",
  apiPath: "/api/locations",
  basePath: "/master/locations",
  singular: "Location",
  title: "Location Master",
  subtitle: "Manage storage locations and their hierarchy",
  newLabel: "New Location",
  nameOf: (l) => l.name,
  codeOf: (l) => l.code,

  stats: (rows) => [
    { icon: MapPinned, iconBg: "bg-blue-100", iconColor: "text-blue-600", label: "Locations", value: rows.length, caption: "Total locations" },
    { icon: CheckCircle2, iconBg: "bg-emerald-100", iconColor: "text-emerald-600", label: "Active", value: rows.filter((l) => l.isActive).length, caption: "Currently selectable" },
  ],
  columns: [
    { header: "Code", cell: (l) => l.code, className: "font-medium text-slate-900" },
    { header: "Name", cell: (l) => l.name },
    { header: "Parent", cell: (l) => l.parentName ?? "-" },
    { header: "Sub-locations", cell: (l) => l.childrenCount },
    { header: "In Use", cell: (l) => <span className="font-medium text-brand">{l.usageCount}</span> },
  ],
  searchText: (l) => [l.code, l.name, l.parentName ?? ""],
  deleteMessage: "This permanently deletes the location. A location with sub-locations cannot be deleted. This can't be undone.",

  schema: locationInputSchema,
  fields: [
    { kind: "text", name: "code", label: "Location Code", hint: "Unique code for this location.", placeholder: "WH-01", icon: MapPinned, required: true },
    { kind: "text", name: "name", label: "Location Name", hint: "Name of the location.", placeholder: "Main Warehouse", required: true },
    {
      kind: "select", name: "parentId", label: "Parent Location", hint: "Leave empty for a top-level location.",
      emptyLabel: "None (top level)", options: { self: (l) => `${l.code} - ${l.name}` },
    },
    { kind: "status", label: "Status", hint: "Set active to make this location selectable." },
  ],

  summary: [
    { label: "Location Code", value: (l) => l.code },
    { label: "Parent", value: (l) => l.parentName ?? "Top level" },
    { label: "Sub-locations", value: (l) => l.childrenCount },
  ],
};
