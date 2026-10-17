"use client";

import { X } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type FloatingBulkAction = {
  key: string;
  label: string;
  icon?: LucideIcon;
  variant?: "default" | "destructive";
  onRun: () => void;
};

/**
 * The bulk-actions toolbar for an active selection. Rendered as the first
 * thing inside a table's own wrapper, which in every page here sits
 * immediately below the stat-card grid — combined with `sticky`, it reads
 * as a floating bar just under the stats as the person scrolls the table.
 * Only visible while `count > 0` (i.e. selection mode is active).
 */
export default function FloatingBulkActionsBar({
  count,
  actions,
  onClear,
}: {
  count: number;
  actions: FloatingBulkAction[];
  onClear: () => void;
}) {
  if (count === 0) return null;

  return (
    <div className="sticky top-4 z-30 mx-5 mt-4 flex flex-wrap items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-2 shadow-lg">
      <span className="mr-1 border-r border-slate-200 pr-3 text-sm font-medium text-slate-700">
        {count} selected
      </span>
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <button
            key={action.key}
            onClick={action.onRun}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              action.variant === "destructive" ? "text-rose-600 hover:bg-rose-50" : "text-slate-700 hover:bg-slate-100"
            }`}
          >
            {Icon && <Icon size={15} />}
            {action.label}
          </button>
        );
      })}
      <button
        onClick={onClear}
        title="Clear selection"
        className="ml-1 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
      >
        <X size={15} />
      </button>
    </div>
  );
}
