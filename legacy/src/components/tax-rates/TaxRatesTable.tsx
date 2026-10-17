"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, RotateCcw, Eye, Pencil, Trash2, ChevronsLeft, ChevronsRight, ChevronLeft, ChevronRight, CheckCircle2, XCircle, CheckSquare, X } from "lucide-react";
import StatusBadge from "@/components/account-groups/StatusBadge";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { useRowSelection } from "@/components/shared/bulk-actions/useRowSelection";
import { useBulkApi, type BulkResult } from "@/components/shared/bulk-actions/useBulkApi";
import RowContextMenu, { type ContextMenuPosition } from "@/components/shared/bulk-actions/RowContextMenu";
import FloatingBulkActionsBar from "@/components/shared/bulk-actions/FloatingBulkActionsBar";
import BulkResultBanner from "@/components/shared/bulk-actions/BulkResultBanner";
import type { RecordStatus } from "@/lib/constants";

export type TaxRateRow = {
  id: number;
  code: string;
  name: string;
  ratePercent: string;
  hsnSacCode: string | null;
  inUseCount: number;
  status: RecordStatus;
};

const PAGE_SIZE_OPTIONS = [10, 25, 50];

export default function TaxRatesTable({ rows }: { rows: TaxRateRow[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<RecordStatus | "ALL">("ALL");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [deleteTarget, setDeleteTarget] = useState<TaxRateRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return rows.filter((row) => {
      const matchesSearch =
        search.trim() === "" ||
        row.name.toLowerCase().includes(search.toLowerCase()) ||
        row.code.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "ALL" || row.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [rows, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const startIndex = filtered.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, filtered.length);

  // Bulk selection: checkboxes stay hidden until the person right-clicks a
  // row and chooses "Select" — see useRowSelection's selectionMode. Once
  // active, bulk actions run against the same per-row PATCH/DELETE
  // endpoints the row action buttons already use — see useBulkApi.
  const selection = useRowSelection(pageRows, (r) => r.id);
  const { runBulkPatch, runBulkDelete, running } = useBulkApi("/api/tax-rates");
  const [contextMenu, setContextMenu] = useState<ContextMenuPosition>(null);
  const [contextMenuRow, setContextMenuRow] = useState<TaxRateRow | null>(null);
  const [contextMenuIndex, setContextMenuIndex] = useState(0);
  const [bulkResult, setBulkResult] = useState<BulkResult | null>(null);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);

  function resetFilters() {
    setSearch("");
    setStatusFilter("ALL");
    setPage(1);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/tax-rates/${deleteTarget.id}`, { method: "DELETE" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Failed to delete tax rate.");
      setDeleteTarget(null);
      router.refresh();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setDeleting(false);
    }
  }

  async function handleBulkActivate(isActive: boolean) {
    const result = await runBulkPatch(Array.from(selection.selectedIds), { isActive });
    setBulkResult(result);
    selection.exitSelectionMode();
    router.refresh();
  }

  async function handleBulkDelete() {
    const result = await runBulkDelete(Array.from(selection.selectedIds));
    setBulkResult(result);
    setBulkDeleteConfirm(false);
    selection.exitSelectionMode();
    router.refresh();
  }

  function openContextMenu(e: React.MouseEvent, row: TaxRateRow, index: number) {
    e.preventDefault();
    setContextMenuRow(row);
    setContextMenuIndex(index);
    setContextMenu({ x: e.clientX, y: e.clientY });
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-card">
      <FloatingBulkActionsBar
        count={selection.count}
        onClear={selection.exitSelectionMode}
        actions={[
          { key: "activate", label: "Activate", icon: CheckCircle2, onRun: () => handleBulkActivate(true) },
          { key: "deactivate", label: "Deactivate", icon: XCircle, onRun: () => handleBulkActivate(false) },
          { key: "delete", label: "Delete", icon: Trash2, variant: "destructive", onRun: () => setBulkDeleteConfirm(true) },
        ]}
      />

      {bulkResult && <BulkResultBanner result={bulkResult} onDismiss={() => setBulkResult(null)} />}

      <div className="flex flex-wrap items-center gap-3 px-5 py-4">
        <div className="relative min-w-[220px] flex-1">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search tax rates..."
            className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as RecordStatus | "ALL");
            setPage(1);
          }}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-brand"
        >
          <option value="ALL">All</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>

        <button
          onClick={resetFilters}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <RotateCcw size={15} />
          Reset
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-y border-slate-200 text-xs font-medium uppercase tracking-wide text-slate-500">
              {selection.selectionMode && (
                <th className="w-10 px-5 py-3">
                  <input
                    type="checkbox"
                    checked={selection.allSelected}
                    onChange={() => (selection.allSelected ? selection.clear() : selection.selectAll())}
                    className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand"
                  />
                </th>
              )}
              <th className={selection.selectionMode ? "px-3 py-3 font-medium" : "px-5 py-3 font-medium"}>#</th>
              <th className="px-3 py-3 font-medium">Code</th>
              <th className="px-3 py-3 font-medium">Name</th>
              <th className="px-3 py-3 font-medium">Rate %</th>
              <th className="px-3 py-3 font-medium">HSN/SAC</th>
              <th className="px-3 py-3 font-medium">In Use</th>
              <th className="px-3 py-3 font-medium">Status</th>
              <th className="px-5 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {pageRows.map((row, i) => (
              <tr
                key={row.id}
                onContextMenu={(e) => openContextMenu(e, row, i)}
                className={`hover:bg-slate-50/60 ${selection.isSelected(row.id) ? "bg-blue-50/60" : ""}`}
              >
                {selection.selectionMode && (
                  <td className="px-5 py-3.5">
                    <input
                      type="checkbox"
                      checked={selection.isSelected(row.id)}
                      onChange={(e) => selection.toggle(row.id, i, (e.nativeEvent as MouseEvent).shiftKey)}
                      className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand"
                    />
                  </td>
                )}
                <td className={selection.selectionMode ? "px-3 py-3.5 text-slate-500" : "px-5 py-3.5 text-slate-500"}>
                  {(currentPage - 1) * pageSize + i + 1}
                </td>
                <td className="px-3 py-3.5 font-medium text-slate-900">{row.code}</td>
                <td className="px-3 py-3.5 text-slate-800">{row.name}</td>
                <td className="px-3 py-3.5 text-slate-500">{row.ratePercent}%</td>
                <td className="px-3 py-3.5 text-slate-500">{row.hsnSacCode || "—"}</td>
                <td className="px-3 py-3.5">
                  <span className="font-medium text-brand">{row.inUseCount}</span>
                </td>
                <td className="px-3 py-3.5">
                  <StatusBadge status={row.status} />
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center justify-end gap-1.5">
                    <Link href={`/master/tax-rates/${row.id}`} title="View" className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700">
                      <Eye size={16} />
                    </Link>
                    <Link href={`/master/tax-rates/${row.id}/edit`} title="Edit" className="rounded-md p-1.5 text-brand hover:bg-blue-50">
                      <Pencil size={16} />
                    </Link>
                    <button
                      title="Delete"
                      onClick={() => {
                        setDeleteError(null);
                        setDeleteTarget(row);
                      }}
                      className="rounded-md p-1.5 text-rose-500 hover:bg-rose-50"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {pageRows.length === 0 && (
              <tr>
                <td colSpan={selection.selectionMode ? 9 : 8} className="px-5 py-10 text-center text-sm text-slate-400">
                  No tax rates match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-5 py-4">
        <div className="text-sm text-slate-500">
          Showing {startIndex} to {endIndex} of {filtered.length} entries
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={() => setPage(1)} disabled={currentPage === 1} className="rounded-md border border-slate-200 p-1.5 text-slate-500 disabled:opacity-40 hover:bg-slate-50">
            <ChevronsLeft size={15} />
          </button>
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="rounded-md border border-slate-200 p-1.5 text-slate-500 disabled:opacity-40 hover:bg-slate-50">
            <ChevronLeft size={15} />
          </button>
          {Array.from({ length: totalPages }).slice(0, 3).map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              className={`h-8 w-8 rounded-md text-sm font-medium ${
                currentPage === i + 1 ? "bg-brand text-white" : "border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {i + 1}
            </button>
          ))}
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="rounded-md border border-slate-200 p-1.5 text-slate-500 disabled:opacity-40 hover:bg-slate-50">
            <ChevronRight size={15} />
          </button>
          <button onClick={() => setPage(totalPages)} disabled={currentPage === totalPages} className="rounded-md border border-slate-200 p-1.5 text-slate-500 disabled:opacity-40 hover:bg-slate-50">
            <ChevronsRight size={15} />
          </button>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="ml-2 rounded-md border border-slate-200 px-2 py-1.5 text-sm text-slate-600 outline-none"
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size} / page
              </option>
            ))}
          </select>
        </div>
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        title={`Delete "${deleteTarget?.name}"?`}
        message="This permanently deletes the tax rate and unlinks it from any products using it. This can't be undone."
        error={deleteError}
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => {
          setDeleteTarget(null);
          setDeleteError(null);
        }}
      />

      <ConfirmDialog
        open={bulkDeleteConfirm}
        title={`Delete ${selection.count} tax rate${selection.count === 1 ? "" : "s"}?`}
        message="This unlinks them from any products using them first. This can't be undone."
        loading={running}
        onConfirm={handleBulkDelete}
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
                  label: contextMenuRow && selection.isSelected(contextMenuRow.id) ? "Deselect this row" : "Select this row",
                  icon: CheckSquare,
                  onRun: () => contextMenuRow && selection.toggle(contextMenuRow.id, contextMenuIndex),
                },
                {
                  key: "clear",
                  label: "Clear Selection",
                  icon: X,
                  onRun: () => selection.exitSelectionMode(),
                },
              ]
            : [
                {
                  key: "select",
                  label: "Select",
                  icon: CheckSquare,
                  onRun: () => contextMenuRow && selection.enterSelectionMode(contextMenuRow.id, contextMenuIndex),
                },
              ]
        }
      />
    </div>
  );
}
