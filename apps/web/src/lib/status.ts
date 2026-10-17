export type RecordStatus = "ACTIVE" | "INACTIVE";

export const STATUS_STYLES: Record<RecordStatus, { label: string; badge: string; dot: string }> = {
  ACTIVE: { label: "Active", badge: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" },
  INACTIVE: { label: "Inactive", badge: "bg-slate-100 text-slate-500", dot: "bg-slate-400" },
};
