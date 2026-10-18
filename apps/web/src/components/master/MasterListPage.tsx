import { CheckSquare, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, CheckCircle2, Eye, Pencil, Plus, RotateCcw, Search, Trash2, X, XCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { createColumnHelper, flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, useReactTable } from "@tanstack/react-table";
import { ApiError } from "../../lib/api";
import { useCanWrite } from "../../lib/useCanWrite";
import ConfirmDialog from "../shared/ConfirmDialog";
import StatCard from "../shared/StatCard";
import StatusBadge from "../shared/StatusBadge";
import BulkResultBanner from "./bulk/BulkResultBanner";
import FloatingBulkActionsBar from "./bulk/FloatingBulkActionsBar";
import RowContextMenu, { type ContextMenuPosition } from "./bulk/RowContextMenu";
import { useBulkApi, type BulkResult } from "./bulk/useBulkApi";
import { useRowSelection } from "./bulk/useRowSelection";
import { useMasterDelete, useMasterList } from "./masterApi";
import type { MasterConfig, MasterRow } from "./types";

const PAGE_SIZES = [10, 25, 50, 100];
type StatusFilter = "ALL" | "ACTIVE" | "INACTIVE";

/** List page for any master: stats, search, status filter, paging, row actions, selection + bulk actions. */
export default function MasterListPage<Row extends MasterRow>({ cfg }: { cfg: MasterConfig<Row> }) {
  const qc = useQueryClient();
  const canWrite = useCanWrite();
  const { data, isLoading, error } = useMasterList<Row>(cfg);
  const del = useMasterDelete(cfg);
  const { runBulkPatch, runBulkDelete, running } = useBulkApi(cfg.apiPath);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [deleteTarget, setDeleteTarget] = useState<Row | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuPosition>(null);
  const [contextRow, setContextRow] = useState<Row | null>(null);
  const [contextIndex, setContextIndex] = useState(0);
  const [bulkResult, setBulkResult] = useState<BulkResult | null>(null);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);

  const all = data ?? [];
  const rows = useMemo(() => all.filter((a) => (status === "ALL" ? true : status === "ACTIVE" ? a.isActive : !a.isActive)), [all, status]);

  const columns = useMemo(() => {
    const h = createColumnHelper<Row>();
    return [
      h.display({
        id: "index",
        header: "#",
        cell: (c) => c.table.getRowModel().rows.indexOf(c.row) + 1 + c.table.getState().pagination.pageIndex * c.table.getState().pagination.pageSize,
        meta: { className: "text-slate-500" },
      }),
      ...cfg.columns.map((col, i) => h.display({ id: `c${i}`, header: col.header, cell: (c) => col.cell(c.row.original), meta: { className: col.className } })),
      h.display({ id: "status", header: "Status", cell: (c) => <StatusBadge status={c.row.original.isActive ? "ACTIVE" : "INACTIVE"} /> }),
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cfg]);

  const table = useReactTable({
    data: rows,
    columns,
    state: { globalFilter: search },
    onGlobalFilterChange: setSearch,
    globalFilterFn: (row, _id, value: string) => {
      const q = value.trim().toLowerCase();
      return !q || cfg.searchText(row.original).some((v) => v.toLowerCase().includes(q));
    },
    initialState: { pagination: { pageSize: 10 } },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const pageRows = table.getRowModel().rows.map((r) => r.original);
  const selection = useRowSelection(pageRows, (r) => r.id);
  const { pageIndex, pageSize } = table.getState().pagination;
  const filteredCount = table.getFilteredRowModel().rows.length;
  const start = filteredCount === 0 ? 0 : pageIndex * pageSize + 1;
  const end = Math.min(filteredCount, (pageIndex + 1) * pageSize);
  const pageCount = table.getPageCount();
  const selecting = canWrite && selection.selectionMode;
  const colCount = columns.length + 1 + (selecting ? 1 : 0);

  function reset() {
    setSearch("");
    setStatus("ALL");
    table.setPageIndex(0);
  }
  async function onDelete() {
    if (!deleteTarget) return;
    setDeleteError(null);
    try {
      await del.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
    } catch (e) {
      setDeleteError(e instanceof ApiError ? e.message : `Failed to delete ${cfg.singular.toLowerCase()}.`);
    }
  }
  async function bulkActivate(isActive: boolean) {
    const result = await runBulkPatch(Array.from(selection.selectedIds), { isActive });
    setBulkResult(result);
    selection.exitSelectionMode();
    await qc.invalidateQueries({ queryKey: [cfg.key] });
  }
  async function bulkDelete() {
    const result = await runBulkDelete(Array.from(selection.selectedIds));
    setBulkResult(result);
    setBulkDeleteConfirm(false);
    selection.exitSelectionMode();
    await qc.invalidateQueries({ queryKey: [cfg.key] });
  }
  function openContextMenu(e: React.MouseEvent, row: Row, index: number) {
    if (!canWrite) return;
    e.preventDefault();
    setContextRow(row);
    setContextIndex(index);
    setContextMenu({ x: e.clientX, y: e.clientY });
  }

  const pageBtn = "rounded-md border border-slate-200 p-1.5 text-slate-500 disabled:opacity-40 hover:bg-slate-50";
  const lower = cfg.singular.toLowerCase();
  const first = selecting ? "px-3" : "px-5";

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{cfg.title}</h1>
          <p className="mt-1 text-sm text-slate-500">{cfg.subtitle}</p>
        </div>
        {canWrite && (
          <Link to={`${cfg.basePath}/new`} className="flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-hover">
            <Plus size={16} /> {cfg.newLabel}
          </Link>
        )}
      </div>

      <div className={`mt-6 grid grid-cols-1 gap-4 ${cfg.stats(all).length >= 4 ? "sm:grid-cols-4" : cfg.stats(all).length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
        {cfg.stats(all).map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white shadow-card">
        {selecting && (
          <FloatingBulkActionsBar
            count={selection.count}
            onClear={selection.exitSelectionMode}
            actions={[
              { key: "activate", label: "Activate", icon: CheckCircle2, onRun: () => bulkActivate(true) },
              { key: "deactivate", label: "Deactivate", icon: XCircle, onRun: () => bulkActivate(false) },
              { key: "delete", label: "Delete", icon: Trash2, variant: "destructive", onRun: () => setBulkDeleteConfirm(true) },
            ]}
          />
        )}
        {bulkResult && <BulkResultBanner result={bulkResult} onDismiss={() => setBulkResult(null)} />}

        <div className="flex flex-wrap items-center gap-3 px-5 py-4">
          <div className="relative min-w-[220px] flex-1">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                table.setPageIndex(0);
              }}
              placeholder={`Search ${lower}...`}
              aria-label={`Search ${lower}`}
              className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
            />
          </div>
          <select
            value={status}
            aria-label="Status filter"
            onChange={(e) => {
              setStatus(e.target.value as StatusFilter);
              table.setPageIndex(0);
            }}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-brand"
          >
            <option value="ALL">All</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
          <button onClick={reset} className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            <RotateCcw size={15} /> Reset
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id} className="border-y border-slate-200 text-xs font-medium uppercase tracking-wide text-slate-500">
                  {selecting && (
                    <th className="w-10 px-5 py-3">
                      <input
                        type="checkbox"
                        aria-label="Select all rows"
                        checked={selection.allSelected}
                        onChange={() => (selection.allSelected ? selection.clear() : selection.selectAll())}
                        className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand"
                      />
                    </th>
                  )}
                  {hg.headers.map((h) => (
                    <th key={h.id} className={h.column.id === "index" ? `${first} py-3 font-medium` : "px-3 py-3 font-medium"}>
                      {flexRender(h.column.columnDef.header, h.getContext())}
                    </th>
                  ))}
                  <th className="px-5 py-3 text-right font-medium">Actions</th>
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading && <tr><td colSpan={colCount} className="px-5 py-10 text-center text-sm text-slate-400">Loading...</td></tr>}
              {error && <tr><td colSpan={colCount} className="px-5 py-10 text-center text-sm text-rose-600">{error instanceof ApiError ? error.message : `Could not load ${lower} list.`}</td></tr>}
              {table.getRowModel().rows.map((row, i) => (
                <tr
                  key={row.original.id}
                  onContextMenu={(e) => openContextMenu(e, row.original, i)}
                  className={`hover:bg-slate-50/60 ${selecting && selection.isSelected(row.original.id) ? "bg-blue-50/60" : ""}`}
                >
                  {selecting && (
                    <td className="px-5 py-3.5">
                      <input
                        type="checkbox"
                        aria-label={`Select ${cfg.nameOf(row.original)}`}
                        checked={selection.isSelected(row.original.id)}
                        onChange={(e) => selection.toggle(row.original.id, i, (e.nativeEvent as MouseEvent).shiftKey)}
                        className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand"
                      />
                    </td>
                  )}
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className={`${cell.column.id === "index" ? first : "px-3"} py-3.5 ${(cell.column.columnDef.meta as { className?: string } | undefined)?.className ?? "text-slate-800"}`}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link to={`${cfg.basePath}/${row.original.id}`} title="View" className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700"><Eye size={16} /></Link>
                      {canWrite && (
                        <>
                          <Link to={`${cfg.basePath}/${row.original.id}/edit`} title="Edit" className="rounded-md p-1.5 text-brand hover:bg-blue-50"><Pencil size={16} /></Link>
                          <button
                            title="Delete"
                            onClick={() => {
                              setDeleteError(null);
                              setDeleteTarget(row.original);
                            }}
                            className="rounded-md p-1.5 text-rose-500 hover:bg-rose-50"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {!isLoading && !error && pageRows.length === 0 && (
                <tr><td colSpan={colCount} className="px-5 py-10 text-center text-sm text-slate-400">No {lower} records match your filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-5 py-4">
          <div className="text-sm text-slate-500">Showing {start} to {end} of {filteredCount} entries</div>
          <div className="flex items-center gap-1.5">
            <button className={pageBtn} disabled={!table.getCanPreviousPage()} onClick={() => table.setPageIndex(0)} aria-label="First page"><ChevronsLeft size={15} /></button>
            <button className={pageBtn} disabled={!table.getCanPreviousPage()} onClick={() => table.previousPage()} aria-label="Previous page"><ChevronLeft size={15} /></button>
            {Array.from({ length: Math.min(pageCount, 3) }).map((_, i) => (
              <button key={i} onClick={() => table.setPageIndex(i)} className={`h-8 w-8 rounded-md text-sm font-medium ${pageIndex === i ? "bg-brand text-white" : "border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
                {i + 1}
              </button>
            ))}
            <button className={pageBtn} disabled={!table.getCanNextPage()} onClick={() => table.nextPage()} aria-label="Next page"><ChevronRight size={15} /></button>
            <button className={pageBtn} disabled={!table.getCanNextPage()} onClick={() => table.setPageIndex(pageCount - 1)} aria-label="Last page"><ChevronsRight size={15} /></button>
            <select value={pageSize} aria-label="Rows per page" onChange={(e) => table.setPageSize(Number(e.target.value))} className="ml-2 rounded-md border border-slate-200 px-2 py-1.5 text-sm text-slate-600 outline-none">
              {PAGE_SIZES.map((n) => <option key={n} value={n}>{n} / page</option>)}
            </select>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        title={`Delete "${deleteTarget ? cfg.nameOf(deleteTarget) : ""}"?`}
        message={cfg.deleteMessage}
        error={deleteError}
        loading={del.isPending}
        onConfirm={onDelete}
        onCancel={() => {
          setDeleteTarget(null);
          setDeleteError(null);
        }}
      />
      <ConfirmDialog
        open={bulkDeleteConfirm}
        title={`Delete ${selection.count} ${lower}${selection.count === 1 ? "" : "s"}?`}
        message={`Each one is deleted individually. ${cfg.deleteMessage}`}
        loading={running}
        onConfirm={bulkDelete}
        onCancel={() => setBulkDeleteConfirm(false)}
      />
      <RowContextMenu
        position={contextMenu}
        onClose={() => setContextMenu(null)}
        actions={
          selection.selectionMode
            ? [
                {
                  key: "toggle",
                  label: contextRow && selection.isSelected(contextRow.id) ? "Deselect this row" : "Select this row",
                  icon: CheckSquare,
                  onRun: () => contextRow && selection.toggle(contextRow.id, contextIndex),
                },
                { key: "clear", label: "Clear Selection", icon: X, onRun: () => selection.exitSelectionMode() },
              ]
            : [{ key: "select", label: "Select", icon: CheckSquare, onRun: () => contextRow && selection.enterSelectionMode(contextRow.id, contextIndex) }]
        }
      />
    </div>
  );
}
