"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronDown, Network, Save } from "lucide-react";
import { ACCOUNT_TYPES, type AccountType, type RecordStatus } from "@/lib/constants";

type AccountGroupOption = {
  id: number;
  code: string;
  description: string;
  type: AccountType;
  isActive: boolean;
};

export type SubGroupFormInitial = {
  id: number;
  accountGroupId: number;
  code: string;
  name: string;
  status: RecordStatus;
};

export default function SubGroupForm({ initial }: { initial?: SubGroupFormInitial }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEdit = Boolean(initial);

  const [accountGroups, setAccountGroups] = useState<AccountGroupOption[]>([]);
  const [accountGroupId, setAccountGroupId] = useState(
    initial ? String(initial.accountGroupId) : searchParams.get("accountGroupId") ?? ""
  );
  const [code, setCode] = useState(initial?.code ?? "");
  const [name, setName] = useState(initial?.name ?? "");
  const [status, setStatus] = useState<RecordStatus>(initial?.status ?? "ACTIVE");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/account-groups")
      .then((r) => r.json())
      .then((rows: AccountGroupOption[]) => setAccountGroups(rows.filter((g) => g.isActive)))
      .catch(() => setAccountGroups([]));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!accountGroupId || !code.trim() || !name.trim()) {
      setError("Account Group, Sub-Group Code, and Sub-Group Name are required.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(
        isEdit ? `/api/account-sub-groups/${initial!.id}` : "/api/account-sub-groups",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            accountGroupId: Number(accountGroupId),
            code: code.trim(),
            description: name.trim(),
            isActive: status === "ACTIVE",
          }),
        }
      );

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to save sub-group.");
      }

      router.push(isEdit ? `/sub-groups/${initial!.id}` : "/sub-groups");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-6 shadow-card">
      <div>
        <h2 className="text-base font-semibold text-slate-900">Sub-Group Information</h2>
        <p className="mt-1 text-sm text-slate-500">
          {isEdit ? "Update details of this account sub-group." : "Provide details of the new account sub-group."}
        </p>
      </div>
      <div className="my-5 border-t border-slate-200" />

      {error && (
        <div className="mb-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="space-y-5">
        {/* Account Group */}
        <div>
          <label className="text-sm font-medium text-slate-800">
            Account Group <span className="text-rose-500">*</span>
          </label>
          <p className="mb-2 text-xs text-slate-500">Select the account group this sub-group belongs to.</p>
          <div className="relative">
            <Network size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-500" />
            <select
              value={accountGroupId}
              onChange={(e) => setAccountGroupId(e.target.value)}
              className="w-full appearance-none rounded-lg border border-slate-200 py-2.5 pl-10 pr-10 text-sm text-slate-800 outline-none focus:border-brand focus:ring-1 focus:ring-brand"
            >
              <option value="">
                {accountGroups.length === 0 ? "No account groups available — create one first" : "Select an account group"}
              </option>
              {accountGroups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.code} — {g.description} ({ACCOUNT_TYPES[g.type].label})
                </option>
              ))}
            </select>
            <ChevronDown size={16} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>
        </div>

        {/* Code / Name */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-slate-800">
              Sub-Group Code <span className="text-rose-500">*</span>
            </label>
            <p className="mb-2 text-xs text-slate-500">Unique code within this group.</p>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="G-1000-1"
              className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-800">
              Sub-Group Name <span className="text-rose-500">*</span>
            </label>
            <p className="mb-2 text-xs text-slate-500">Name of the account sub-group.</p>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Cash & Bank"
              className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
            />
          </div>
        </div>

        {/* Status */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-slate-800">Status</label>
            <p className="mb-2 text-xs text-slate-500">Set active to make this sub-group available.</p>
            <div className="relative">
              <span
                className={`pointer-events-none absolute left-3.5 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full ${
                  status === "ACTIVE" ? "bg-emerald-500" : "bg-slate-400"
                }`}
              />
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as RecordStatus)}
                className="w-full appearance-none rounded-lg border border-slate-200 py-2.5 pl-8 pr-10 text-sm text-slate-800 outline-none focus:border-brand focus:ring-1 focus:ring-brand"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
              <ChevronDown size={16} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="my-6 border-t border-slate-200" />

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => router.push(isEdit ? `/sub-groups/${initial!.id}` : "/sub-groups")}
          className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-hover disabled:opacity-60"
        >
          <Save size={16} />
          {submitting ? "Saving..." : isEdit ? "Update Sub-Group" : "Save Sub-Group"}
        </button>
      </div>
    </form>
  );
}
