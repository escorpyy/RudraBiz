"use client";

import { useCallback, useMemo, useRef, useState } from "react";

/**
 * Generic multi-row selection for any table. Pass the current page's rows
 * and a way to read each row's id; the hook tracks a Set of selected ids
 * and exposes helpers for checkbox toggling, shift-click range select,
 * and select all / clear — independent of what the rows actually are.
 */
export function useRowSelection<T>(rows: T[], getId: (row: T) => number | string) {
  const [selectedIds, setSelectedIds] = useState<Set<number | string>>(new Set());
  const lastIndexRef = useRef<number | null>(null);

  const ids = useMemo(() => rows.map(getId), [rows, getId]);

  const isSelected = useCallback((id: number | string) => selectedIds.has(id), [selectedIds]);

  // Checkbox click: toggles one row, or with Shift held, selects the whole
  // range between the last-clicked row and this one (standard file-manager
  // behavior).
  const toggle = useCallback(
    (id: number | string, index: number, shiftKey?: boolean) => {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (shiftKey && lastIndexRef.current !== null) {
          const [start, end] = [lastIndexRef.current, index].sort((a, b) => a - b);
          for (let i = start; i <= end; i++) next.add(ids[i]);
        } else if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
        return next;
      });
      lastIndexRef.current = index;
    },
    [ids]
  );

  // Right-clicking a row that isn't already part of the selection selects
  // just that row, matching how file managers behave.
  const selectOnly = useCallback((id: number | string, index: number) => {
    setSelectedIds(new Set([id]));
    lastIndexRef.current = index;
  }, []);

  const clear = useCallback(() => setSelectedIds(new Set()), []);
  const selectAll = useCallback(() => setSelectedIds(new Set(ids)), [ids]);

  const selectedRows = useMemo(() => rows.filter((r) => selectedIds.has(getId(r))), [rows, selectedIds, getId]);

  return {
    selectedIds,
    selectedRows,
    count: selectedIds.size,
    isSelected,
    toggle,
    selectOnly,
    clear,
    selectAll,
    allSelected: rows.length > 0 && selectedIds.size === rows.length,
  };
}
