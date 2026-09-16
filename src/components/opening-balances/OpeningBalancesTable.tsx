"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Filter,
  RotateCcw,
  Eye,
  Pencil,
  Trash2,
  ChevronsLeft,
  ChevronsRight,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Layers,
  MapPin,
  Trash,
  CheckSquare,
  X,
} from "lucide-react";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { useRowSelection } from "@/components/shared/bulk-actions/useRowSelection";
import { useBulkApi, type BulkResult } from "@/components/shared/bulk-actions/useBulkApi";
import RowContextMenu, { type ContextMenuPosition } from "@/components/shared/bulk-actions/RowContextMenu";
import FloatingBulkActionsBar from "@/components/shared/bulk-actions/FloatingBulkActionsBar";
import BulkResultBanner from "@/components/shared/bulk-actions/BulkResultBanner";

export type OpeningBalanceRow = {
  id: number;
  generalLedgerId: number;
  generalLedgerCode: string;
  generalLedgerName: string;
  subLedgerName: string | null;
  branchName: string;
  debit: number;
  credit: number;
  remarks: string | null;
  isCarriedForward: boolean;
};

const PAGE_SIZE_OPTIONS = [10, 25, 50];

function money(value: number) {
  return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function OpeningBalancesTable({
  rows,
  generalLedgerOptions,
  showBranchColumn,
}: {
  rows: OpeningBalanceRow[];
  generalLedgerOptions: { id: number; name: string }[];
  /** True when the header switcher is on "All Branches", where the branch of each row matters. */
  showBranchColumn: boolean;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [glFilter, setGlFilter] = useState<string>("ALL");
  const [sideFilter, setSideFilter] = useState<"DEBIT" | "CREDIT" | "ALL">("ALL");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [deleteTarget, setDeleteTarget] = useState<OpeningBalanceRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return rows.filter((row) => {
      const term = search.trim().toLowerCase();
      const matchesSearch =
        term === "" ||
        row.generalLedgerName.toLowerCase().includes(term) ||
        row.generalLedgerCode.toLowerCase().includes(term) ||
        (row.subLedgerName?.toLowerCase().includes(term) ?? false) ||
        (row.remarks?.toLowerCase().includes(term) ?? false);
      const matchesGl = glFilter === "ALL" || String(row.generalLedgerId) === glFilter;
      const matchesSide =
        sideFilter === "ALL" ||
        (sideFilter === "DEBIT" ? row.debit > 0 : row.credit > 0);
      return matchesSearch && matchesGl && matchesSide;
    });
  }, [rows, search, glFilter, sideFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const startIndex = filtered.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, filtered.length);

  const selection = useRowSelection(pageRows, (r) => r.id);
  const { runBulkDelete, running } = useBulkApi("/api/opening-balances");
  const [contextMenu, setContextMenu] = useState<ContextMenuPosition>(null);
  const [contextMenuRow, setContextMenuRow] = useState<OpeningBalanceRow | null>(null);
  const [contextMenuIndex, setContextMenuIndex] = useState(0);
  const [bulkResult, setBulkResult] = useState<BulkResult | null>(null);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);

  // Column count for the empty-state colspan, kept in one place since two
  // columns here are conditional.
  const columnCount = 7 + (showBranchColumn ? 1 : 0) + (selection.selectionMode ? 1 : 0);

  function resetFilters() {
    setSearch("");
    setGlFilter("ALL");
    setSideFilter("ALL");
    setPage(1);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/opening-balances/${deleteTarget.id}`, { method: "DELETE" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Failed to delete opening balance.");
      setDeleteTarget(null);
      router.refresh();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setDeleting(false);
    }
  }

  async function handleBulkDelete() {
    const result = await runBulkDelete(Array.from(selection.selectedIds));
    setBulkResult(result);
    setBulkDeleteConfirm(false);
    selection.exitSelectionMode();
    router.refresh();
  }

  function openContextMenu(e: React.MouseEvent, row: OpeningBalanceRow, index: number) {
    e.preventDefault();
    setContextMenuRow(row);
    setContextMenuIndex(index);
    setContextMenu({ x: e.clientX, y: e.clientY });
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-card">
      {/*
        Only Delete is offered in bulk here. The other masters expose
        Activate/Deactivate, but OpeningBalance has no isActive column —
        a row either exists for the year or it doesn't.
      */}
      <FloatingBulkActionsBar
        count={selection.count}
        onClear={selection.exitSelectionMode}
        actions={[
          {
            key: "delete",
            label: "Delete",
            icon: Trash,
            variant: "destructive",
            onRun: () => setBulkDeleteConfirm(true),
          },
        ]}
      />

      {bulkResult && <BulkResultBanner result={bulkResult} onDismiss={() => setBulkResult(null)} />}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 px-5 py-4">
        <div className="relative min-w-[220px] flex-1">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search ledger, sub-ledger or remarks..."
            className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
          />
        </div>

        <select
          value={glFilter}
          onChange={(e) => {
            setGlFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-brand"
        >
          <option value="ALL">All General Ledgers</option>
          {generalLedgerOptions.map((gl) => (
            <option key={gl.id} value={gl.id}>
              {gl.name}
            </option>
          ))}
        </select>

        <select
          value={sideFilter}
          onChange={(e) => {
            setSideFilter(e.target.value as "DEBIT" | "CREDIT" | "ALL");
            setPage(1);
          }}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-brand"
        >
          <option value="ALL">Debit &amp; Credit</option>
          <option value="DEBIT">Debit only</option>
          <option value="CREDIT">Credit only</option>
        </select>

        <button className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
          <Filter size={15} />
          Filter
        </button>
        <button
          onClick={resetFilters}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <RotateCcw size={15} />
          Reset
        </button>
      </div>

      {/* Table */}
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
              <th className="px-3 py-3 font-medium">General Ledger</th>
              <th className="px-3 py-3 font-medium">Sub-Ledger</th>
              {showBranchColumn && <th className="px-3 py-3 font-medium">Branch</th>}
              <th className="px-3 py-3 text-right font-medium">Debit</th>
              <th className="px-3 py-3 text-right font-medium">Credit</th>
              <th className="px-3 py-3 font-medium">Remarks</th>
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
                <td className="px-3 py-3.5">
                  <span className="inline-flex items-center gap-1.5 font-medium text-slate-900">
                    <BookOpen size={13} className="text-amber-600" />
                    {row.generalLedgerCode}
                  </span>
                  <div className="text-xs text-slate-500">{row.generalLedgerName}</div>
                </td>
                <td className="px-3 py-3.5 text-slate-500">
                  {row.subLedgerName ? (
                    <span className="inline-flex items-center gap-1.5">
                      <Layers size={13} className="text-violet-600" />
                      {row.subLedgerName}
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
                {showBranchColumn && (
                  <td className="px-3 py-3.5 text-slate-500">
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin size={13} className="text-blue-600" />
                      {row.branchName}
                    </span>
                  </td>
                )}
                <td className="px-3 py-3.5 text-right font-medium text-slate-900">
                  {row.debit > 0 ? money(row.debit) : <span className="text-slate-300">—</span>}
                </td>
                <td className="px-3 py-3.5 text-right font-medium text-slate-900">
                  {row.credit > 0 ? money(row.credit) : <span className="text-slate-300">—</span>}
                </td>
                <td className="px-3 py-3.5 text-slate-500">
                  {row.isCarriedForward && (
                    <span className="mr-1.5 inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                      Carried forward
                    </span>
                  )}
                  {row.remarks ?? (row.isCarriedForward ? "" : "—")}
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center justify-end gap-1.5">
                    <Link
                      href={`/master/opening-balance/${row.id}`}
                      title="View"
                      className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                    >
                      <Eye size={16} />
                    </Link>
                    <Link
                      href={`/master/opening-balance/${row.id}/edit`}
                      title="Edit"
                      className="rounded-md p-1.5 text-brand hover:bg-blue-50"
                    >
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
                <td colSpan={columnCount} className="px-5 py-10 text-center text-sm text-slate-400">
                  No opening balances match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-5 py-4">
        <div className="text-sm text-slate-500">
          Showing {startIndex} to {endIndex} of {filtered.length} entries
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setPage(1)}
            disabled={currentPage === 1}
            className="rounded-md border border-slate-200 p-1.5 text-slate-500 disabled:opacity-40 hover:bg-slate-50"
          >
            <ChevronsLeft size={15} />
          </button>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="rounded-md border border-slate-200 p-1.5 text-slate-500 disabled:opacity-40 hover:bg-slate-50"
          >
            <ChevronLeft size={15} />
          </button>
          {Array.from({ length: totalPages })
            .slice(0, 3)
            .map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                className={`h-8 w-8 rounded-md text-sm font-medium ${
                  currentPage === i + 1
                    ? "bg-brand text-white"
                    : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {i + 1}
              </button>
            ))}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="rounded-md border border-slate-200 p-1.5 text-slate-500 disabled:opacity-40 hover:bg-slate-50"
          >
            <ChevronRight size={15} />
          </button>
          <button
            onClick={() => setPage(totalPages)}
            disabled={currentPage === totalPages}
            className="rounded-md border border-slate-200 p-1.5 text-slate-500 disabled:opacity-40 hover:bg-slate-50"
          >
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
        title={`Delete opening balance for "${deleteTarget?.generalLedgerName}"?`}
        message="This permanently deletes the opening balance row. This can't be undone."
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
        title={`Delete ${selection.count} opening balance${selection.count === 1 ? "" : "s"}?`}
        message="This can't be undone. Rows carried forward into a later fiscal year will be skipped."
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
