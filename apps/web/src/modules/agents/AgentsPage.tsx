import { BookOpen, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Eye, IdCard, Pencil, Plus, RotateCcw, Search, Trash2, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router";
import { createColumnHelper, flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, useReactTable } from "@tanstack/react-table";
import type { AgentRow } from "@ntcas/shared";
import ConfirmDialog from "../../components/shared/ConfirmDialog";
import StatCard from "../../components/shared/StatCard";
import StatusBadge from "../../components/shared/StatusBadge";
import { ApiError } from "../../lib/api";
import { useCanWrite } from "../../lib/useCanWrite";
import { useAgents, useDeleteAgent } from "./queries";

const PAGE_SIZES = [10, 25, 50, 100];
const col = createColumnHelper<AgentRow>();

type StatusFilter = "ALL" | "ACTIVE" | "INACTIVE";

export default function AgentsPage() {
  const canWrite = useCanWrite();
  const { data, isLoading, error } = useAgents();
  const del = useDeleteAgent();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [deleteTarget, setDeleteTarget] = useState<AgentRow | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const all = data ?? [];
  const rows = useMemo(
    () => all.filter((a) => (status === "ALL" ? true : status === "ACTIVE" ? a.isActive : !a.isActive)),
    [all, status],
  );

  const columns = useMemo(
    () => [
      col.display({
        id: "index",
        header: "#",
        cell: (c) => c.table.getRowModel().rows.indexOf(c.row) + 1 + c.table.getState().pagination.pageIndex * c.table.getState().pagination.pageSize,
      }),
      col.accessor("code", { header: "Agent Code" }),
      col.accessor("name", { header: "Agent Name" }),
      col.accessor("phone", { header: "Phone" }),
      col.accessor("ledgersCount", { header: "Ledgers" }),
      col.accessor("partiesCount", { header: "Parties" }),
      col.accessor("isActive", { header: "Status" }),
      col.display({ id: "actions", header: "Actions" }),
    ],
    [],
  );

  const table = useReactTable({
    data: rows,
    columns,
    state: { globalFilter: search },
    onGlobalFilterChange: setSearch,
    globalFilterFn: (row, _id, value: string) => {
      const q = value.trim().toLowerCase();
      if (!q) return true;
      const a = row.original;
      return [a.code, a.name, a.phone ?? ""].some((v) => v.toLowerCase().includes(q));
    },
    initialState: { pagination: { pageSize: 10 } },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const { pageIndex, pageSize } = table.getState().pagination;
  const filteredCount = table.getFilteredRowModel().rows.length;
  const start = filteredCount === 0 ? 0 : pageIndex * pageSize + 1;
  const end = Math.min(filteredCount, (pageIndex + 1) * pageSize);
  const pageCount = table.getPageCount();

  async function onDelete() {
    if (!deleteTarget) return;
    setDeleteError(null);
    try {
      await del.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
    } catch (e) {
      setDeleteError(e instanceof ApiError ? e.message : "Failed to delete agent.");
    }
  }

  const pageBtn = "rounded-md border border-slate-200 p-1.5 text-slate-500 disabled:opacity-40 hover:bg-slate-50";
  const th = "px-3 py-3 font-medium";

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Agent Master</h1>
          <p className="mt-1 text-sm text-slate-500">Manage agents/brokers used to tag ledgers, parties, and vouchers</p>
        </div>
        {canWrite && (
          <Link to="/master/agents/new" className="flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-hover">
            <Plus size={16} /> New Agent
          </Link>
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-4">
        <StatCard icon={IdCard} iconBg="bg-blue-100" iconColor="text-blue-600" label="Agents" value={all.length} caption="Total agents" />
        <StatCard icon={IdCard} iconBg="bg-emerald-100" iconColor="text-emerald-600" label="Active" value={all.filter((a) => a.isActive).length} caption="Currently selectable" />
        <StatCard icon={BookOpen} iconBg="bg-amber-100" iconColor="text-amber-600" label="Ledgers" value={all.reduce((s, a) => s + a.ledgersCount, 0)} caption="Ledgers tagged to an agent" />
        <StatCard icon={Users} iconBg="bg-violet-100" iconColor="text-violet-600" label="Parties" value={all.reduce((s, a) => s + a.partiesCount, 0)} caption="Parties tagged to an agent" />
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white shadow-card">
        <div className="flex flex-wrap items-center gap-3 px-5 py-4">
          <div className="relative min-w-[220px] flex-1">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                table.setPageIndex(0);
              }}
              placeholder="Search agents..."
              aria-label="Search agents"
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
          <button
            onClick={() => {
              setSearch("");
              setStatus("ALL");
              table.setPageIndex(0);
            }}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <RotateCcw size={15} /> Reset
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id} className="border-y border-slate-200 text-xs font-medium uppercase tracking-wide text-slate-500">
                  {hg.headers.map((h) => (
                    <th key={h.id} className={h.column.id === "index" ? "px-5 py-3 font-medium" : h.column.id === "actions" ? "px-5 py-3 text-right font-medium" : th}>
                      {flexRender(h.column.columnDef.header, h.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading && (
                <tr><td colSpan={8} className="px-5 py-10 text-center text-sm text-slate-400">Loading...</td></tr>
              )}
              {error && (
                <tr><td colSpan={8} className="px-5 py-10 text-center text-sm text-rose-600">{error instanceof ApiError ? error.message : "Could not load agents."}</td></tr>
              )}
              {table.getRowModel().rows.map((row) => {
                const a = row.original;
                return (
                  <tr key={a.id} className="hover:bg-slate-50/60">
                    <td className="px-5 py-3.5 text-slate-500">{flexRender(columns[0]!.cell, row.getAllCells()[0]!.getContext())}</td>
                    <td className="px-3 py-3.5 font-medium text-slate-900">{a.code}</td>
                    <td className="px-3 py-3.5 text-slate-800">{a.name}</td>
                    <td className="px-3 py-3.5 text-slate-500">{a.phone || "—"}</td>
                    <td className="px-3 py-3.5"><span className="font-medium text-brand">{a.ledgersCount}</span></td>
                    <td className="px-3 py-3.5"><span className="font-medium text-brand">{a.partiesCount}</span></td>
                    <td className="px-3 py-3.5"><StatusBadge status={a.isActive ? "ACTIVE" : "INACTIVE"} /></td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link to={`/master/agents/${a.id}`} title="View" className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700"><Eye size={16} /></Link>
                        {canWrite && (
                          <>
                            <Link to={`/master/agents/${a.id}/edit`} title="Edit" className="rounded-md p-1.5 text-brand hover:bg-blue-50"><Pencil size={16} /></Link>
                            <button
                              title="Delete"
                              onClick={() => {
                                setDeleteError(null);
                                setDeleteTarget(a);
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
                );
              })}
              {!isLoading && !error && table.getRowModel().rows.length === 0 && (
                <tr><td colSpan={8} className="px-5 py-10 text-center text-sm text-slate-400">No agents match your filters.</td></tr>
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
              <button
                key={i}
                onClick={() => table.setPageIndex(i)}
                className={`h-8 w-8 rounded-md text-sm font-medium ${pageIndex === i ? "bg-brand text-white" : "border border-slate-200 text-slate-600 hover:bg-slate-50"}`}
              >
                {i + 1}
              </button>
            ))}
            <button className={pageBtn} disabled={!table.getCanNextPage()} onClick={() => table.nextPage()} aria-label="Next page"><ChevronRight size={15} /></button>
            <button className={pageBtn} disabled={!table.getCanNextPage()} onClick={() => table.setPageIndex(pageCount - 1)} aria-label="Last page"><ChevronsRight size={15} /></button>
            <select
              value={pageSize}
              aria-label="Rows per page"
              onChange={(e) => table.setPageSize(Number(e.target.value))}
              className="ml-2 rounded-md border border-slate-200 px-2 py-1.5 text-sm text-slate-600 outline-none"
            >
              {PAGE_SIZES.map((n) => (
                <option key={n} value={n}>{n} / page</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        title={`Delete "${deleteTarget?.name}"?`}
        message="This permanently deletes the agent and unlinks it from any ledgers, parties, or vouchers it was tagged on. This can't be undone."
        error={deleteError}
        loading={del.isPending}
        onConfirm={onDelete}
        onCancel={() => {
          setDeleteTarget(null);
          setDeleteError(null);
        }}
      />
    </div>
  );
}
