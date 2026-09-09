"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Filter, RotateCcw, Eye, Pencil, Trash2, ChevronsLeft, ChevronsRight, ChevronLeft, ChevronRight } from "lucide-react";
import AccountTypeBadge from "./AccountTypeBadge";
import StatusBadge from "./StatusBadge";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { ACCOUNT_TYPE_LIST, ACCOUNT_TYPES, type AccountType, type RecordStatus } from "@/lib/constants";

export type AccountGroupRow = {
  id: string;
  code: string;
  name: string;
  accountType: AccountType;
  subGroupsCount: number;
  ledgersCount: number;
  status: RecordStatus;
};

const PAGE_SIZE_OPTIONS = [10, 25, 50];

export default function GroupsTable({ rows }: { rows: AccountGroupRow[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<AccountType | "ALL">("ALL");
  const [statusFilter, setStatusFilter] = useState<RecordStatus | "ALL">("ALL");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [deleteTarget, setDeleteTarget] = useState<AccountGroupRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return rows.filter((row) => {
      const matchesSearch =
        search.trim() === "" ||
        row.name.toLowerCase().includes(search.toLowerCase()) ||
        row.code.toLowerCase().includes(search.toLowerCase());
      const matchesType = typeFilter === "ALL" || row.accountType === typeFilter;
      const matchesStatus = statusFilter === "ALL" || row.status === statusFilter;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [rows, search, typeFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const startIndex = filtered.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, filtered.length);

  function resetFilters() {
    setSearch("");
    setTypeFilter("ALL");
    setStatusFilter("ALL");
    setPage(1);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/account-groups/${deleteTarget.id}`, { method: "DELETE" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Failed to delete account group.");
      setDeleteTarget(null);
      router.refresh();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-card">
      {/* Tabs */}
      <div className="flex gap-6 border-b border-slate-200 px-5 pt-4">
        <button className="border-b-2 border-brand pb-3 text-sm font-medium text-brand">Groups</button>
        <Link href="/sub-groups" className="pb-3 text-sm font-medium text-slate-500 hover:text-slate-700">
          Sub-Groups
        </Link>
        <Link href="/master/ledgers" className="pb-3 text-sm font-medium text-slate-500 hover:text-slate-700">
          Ledgers
        </Link>
        <Link href="/master/sub-ledgers" className="pb-3 text-sm font-medium text-slate-500 hover:text-slate-700">
          Sub-Ledgers
        </Link>
      </div>

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
            placeholder="Search groups..."
            className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value as AccountType | "ALL");
            setPage(1);
          }}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-brand"
        >
          <option value="ALL">All</option>
          {ACCOUNT_TYPE_LIST.map((t) => (
            <option key={t} value={t}>
              {ACCOUNT_TYPES[t].label}
            </option>
          ))}
        </select>

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
              <th className="px-5 py-3 font-medium">#</th>
              <th className="px-3 py-3 font-medium">Group Code</th>
              <th className="px-3 py-3 font-medium">Group Name</th>
              <th className="px-3 py-3 font-medium">Account Type</th>
              <th className="px-3 py-3 font-medium">Sub-Groups</th>
              <th className="px-3 py-3 font-medium">Ledgers</th>
              <th className="px-3 py-3 font-medium">Status</th>
              <th className="px-5 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {pageRows.map((row, i) => (
              <tr key={row.id} className="hover:bg-slate-50/60">
                <td className="px-5 py-3.5 text-slate-500">
                  {(currentPage - 1) * pageSize + i + 1}
                </td>
                <td className="px-3 py-3.5 font-medium text-slate-900">{row.code}</td>
                <td className="px-3 py-3.5 text-slate-800">{row.name}</td>
                <td className="px-3 py-3.5">
                  <AccountTypeBadge type={row.accountType} />
                </td>
                <td className="px-3 py-3.5">
                  <span className="font-medium text-brand">{row.subGroupsCount}</span>
                </td>
                <td className="px-3 py-3.5">
                  <span className="font-medium text-brand">{row.ledgersCount}</span>
                </td>
                <td className="px-3 py-3.5">
                  <StatusBadge status={row.status} />
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center justify-end gap-1.5">
                    <Link
                      href={`/account-groups/${row.id}`}
                      title="View"
                      className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                    >
                      <Eye size={16} />
                    </Link>
                    <Link
                      href={`/account-groups/${row.id}/edit`}
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
                <td colSpan={8} className="px-5 py-10 text-center text-sm text-slate-400">
                  No account groups match your filters.
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
        title={`Delete "${deleteTarget?.name}"?`}
        message="This permanently deletes the account group. This can't be undone."
        error={deleteError}
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => {
          setDeleteTarget(null);
          setDeleteError(null);
        }}
      />
    </div>
  );
}
