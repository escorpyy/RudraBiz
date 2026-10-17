"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/**
 * Generic multi-row selection for any table, with an explicit "selection
 * mode": checkboxes and the floating bulk-actions bar only appear once the
 * person right-clicks a row and chooses "Select" (see RowContextMenu).
 * Unchecking the last selected row automatically exits selection mode
 * again, so there's no lingering empty-selection UI state to clear by hand.
 */
export function useRowSelection<T>(rows: T[], getId: (row: T) => number | string) {
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number | string>>(new Set());
  const lastIndexRef = useRef<number | null>(null);

  const ids = useMemo(() => rows.map(getId), [rows, getId]);

  useEffect(() => {
    if (selectionMode && selectedIds.size === 0) setSelectionMode(false);
  }, [selectionMode, selectedIds]);

  const isSelected = useCallback((id: number | string) => selectedIds.has(id), [selectedIds]);

  // Checkbox click: toggles one row, or with Shift held, selects the whole
  // range between the last-clicked row and this one.
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

  // Entry point into selection mode: right-click a row, choose "Select"
  // from the context menu. Selects just that row to start.
  const enterSelectionMode = useCallback((id: number | string, index: number) => {
    setSelectionMode(true);
    setSelectedIds(new Set([id]));
    lastIndexRef.current = index;
  }, []);

  const exitSelectionMode = useCallback(() => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  }, []);

  const clear = useCallback(() => setSelectedIds(new Set()), []);
  const selectAll = useCallback(() => setSelectedIds(new Set(ids)), [ids]);

  const selectedRows = useMemo(() => rows.filter((r) => selectedIds.has(getId(r))), [rows, selectedIds, getId]);

  return {
    selectionMode,
    selectedIds,
    selectedRows,
    count: selectedIds.size,
    isSelected,
    toggle,
    enterSelectionMode,
    exitSelectionMode,
    clear,
    selectAll,
    allSelected: rows.length > 0 && selectedIds.size === rows.length,
  };
}
