"use client";

import { useEffect, useRef } from "react";
import type { LucideIcon } from "lucide-react";

export type ContextMenuPosition = { x: number; y: number } | null;

export type RowContextMenuAction = {
  key: string;
  label: string;
  icon?: LucideIcon;
  variant?: "default" | "destructive";
  disabled?: boolean;
  onRun: () => void;
};

/**
 * Generic right-click menu. Give it a screen position and a list of
 * actions; it renders a floating panel there and closes itself on outside
 * click or Escape. Not tied to any particular table or data shape — the
 * caller decides what the actions do (bulk delete, bulk status change,
 * anything else keyed off the current selection).
 */
export default function RowContextMenu({
  position,
  actions,
  onClose,
}: {
  position: ContextMenuPosition;
  actions: RowContextMenuAction[];
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!position) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [position, onClose]);

  if (!position) return null;

  // Keep the menu on-screen even if the right-click happened near the
  // window's right/bottom edge.
  const style: React.CSSProperties = {
    top: position.y,
    left: position.x,
  };

  return (
    <div
      ref={ref}
      style={style}
      className="fixed z-50 min-w-[200px] rounded-lg border border-slate-200 bg-white py-1.5 shadow-lg"
    >
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <button
            key={action.key}
            disabled={action.disabled}
            onClick={() => {
              action.onRun();
              onClose();
            }}
            className={`flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-sm disabled:cursor-not-allowed disabled:opacity-40 ${
              action.variant === "destructive" ? "text-rose-600 hover:bg-rose-50" : "text-slate-700 hover:bg-slate-50"
            }`}
          >
            {Icon && <Icon size={15} />}
            {action.label}
          </button>
        );
      })}
    </div>
  );
}
