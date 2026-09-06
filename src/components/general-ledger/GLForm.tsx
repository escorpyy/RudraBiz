"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronDown, Layers, Save } from "lucide-react";
import {
  NORMAL_BALANCE_LIST,
  NORMAL_BALANCES,
  GL_TYPE_LIST,
  GL_TYPES,
  type NormalBalance,
  type GLType,
} from "@/lib/constants";

type SubGroupOption = { id: number; code: string; name: string; accountGroup: { name: string } };
type ParentOption = { id: number; code: string; name: string };

export default function GLForm() {
  const router = useRouter();
  const [subGroups, setSubGroups] = useState<SubGroupOption[]>([]);
  const [parents, setParents] = useState<ParentOption[]>([]);

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [accountSubGroupId, setAccountSubGroupId] = useState("");
  const [normalBalance, setNormalBalance] = useState<NormalBalance>("DEBIT");
  const [glType, setGlType] = useState<GLType>("OTHER");
  const [parentId, setParentId] = useState("");
  const [isCashOrBank, setIsCashOrBank] = useState(false);
  const [postsToCashBook, setPostsToCashBook] = useState(false);
  const [requiresSubLedger, setRequiresSubLedger] = useState(false);
  const [allowDocAdjust, setAllowDocAdjust] = useState(false);
  const [isActive, setIsActive] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/account-sub-groups")
      .then((r) => r.json())
      .then(setSubGroups)
      .catch(() => setSubGroups([]));
    fetch("/api/general-ledgers")
      .then((r) => r.json())
      .then((rows: ParentOption[]) => setParents(rows))
      .catch(() => setParents([]));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!code.trim() || !name.trim() || !accountSubGroupId) {
      setError("GL Code, GL Name, and Account Sub-Group are required.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/general-ledgers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: code.trim(),
          name: name.trim(),
          accountSubGroupId: Number(accountSubGroupId),
          normalBalance,
          glType,
          parentId: parentId ? Number(parentId) : null,
          isCashOrBank,
          postsToCashBook,
          requiresSubLedger,
          allowDocAdjust,
          isActive,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to save general ledger.");
      }

      router.push("/master/ledgers");
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
        <h2 className="text-base font-semibold text-slate-900">Ledger Information</h2>
        <p className="mt-1 text-sm text-slate-500">Provide details of the new general ledger account.</p>
      </div>
      <div className="my-5 border-t border-slate-200" />

      {error && (
        <div className="mb-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="space-y-5">
        {/* Account Sub-Group */}
        <div>
          <label className="text-sm font-medium text-slate-800">
            Account Sub-Group <span className="text-rose-500">*</span>
          </label>
          <p className="mb-2 text-xs text-slate-500">Select the sub-group this ledger belongs to.</p>
          <div className="relative">
            <Layers size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-500" />
            <select
              value={accountSubGroupId}
              onChange={(e) => setAccountSubGroupId(e.target.value)}
              className="w-full appearance-none rounded-lg border border-slate-200 py-2.5 pl-10 pr-10 text-sm text-slate-800 outline-none focus:border-brand focus:ring-1 focus:ring-brand"
            >
              <option value="">
                {subGroups.length === 0 ? "No sub-groups available — create one first" : "Select a sub-group"}
              </option>
              {subGroups.map((sg) => (
                <option key={sg.id} value={sg.id}>
                  {sg.code} — {sg.name} ({sg.accountGroup.name})
                </option>
              ))}
            </select>
            <ChevronDown size={16} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>
        </div>

        {/* GL Code / GL Name */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-slate-800">
              GL Code <span className="text-rose-500">*</span>
            </label>
            <p className="mb-2 text-xs text-slate-500">Unique code for this ledger account.</p>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="GL-1000"
              className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-800">
              GL Name <span className="text-rose-500">*</span>
            </label>
            <p className="mb-2 text-xs text-slate-500">Name of the general ledger account.</p>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Cash in Hand"
              className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
            />
          </div>
        </div>

        {/* Normal Balance / GL Type */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-slate-800">
              Normal Balance <span className="text-rose-500">*</span>
            </label>
            <p className="mb-2 text-xs text-slate-500">Side this account normally balances on.</p>
            <div className="relative">
              <select
                value={normalBalance}
                onChange={(e) => setNormalBalance(e.target.value as NormalBalance)}
                className="w-full appearance-none rounded-lg border border-slate-200 py-2.5 pl-3.5 pr-10 text-sm text-slate-800 outline-none focus:border-brand focus:ring-1 focus:ring-brand"
              >
                {NORMAL_BALANCE_LIST.map((nb) => (
                  <option key={nb} value={nb}>
                    {NORMAL_BALANCES[nb].label}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-800">GL Type</label>
            <p className="mb-2 text-xs text-slate-500">Classification used for posting rules.</p>
            <div className="relative">
              <select
                value={glType}
                onChange={(e) => setGlType(e.target.value as GLType)}
                className="w-full appearance-none rounded-lg border border-slate-200 py-2.5 pl-3.5 pr-10 text-sm text-slate-800 outline-none focus:border-brand focus:ring-1 focus:ring-brand"
              >
                {GL_TYPE_LIST.map((t) => (
                  <option key={t} value={t}>
                    {GL_TYPES[t].label}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
          </div>
        </div>

        {/* Parent ledger */}
        <div>
          <label className="text-sm font-medium text-slate-800">Parent Ledger</label>
          <p className="mb-2 text-xs text-slate-500">Optional — nests this ledger under another for hierarchy/roll-up.</p>
          <div className="relative">
            <select
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className="w-full appearance-none rounded-lg border border-slate-200 py-2.5 pl-3.5 pr-10 text-sm text-slate-800 outline-none focus:border-brand focus:ring-1 focus:ring-brand"
            >
              <option value="">None (top-level)</option>
              {parents.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} — {p.name}
                </option>
              ))}
            </select>
            <ChevronDown size={16} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>
        </div>

        {/* Flags */}
        <div>
          <label className="text-sm font-medium text-slate-800">Posting Options</label>
          <p className="mb-2 text-xs text-slate-500">Behavior flags that control how this ledger is used in vouchers.</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[
              { checked: isCashOrBank, set: setIsCashOrBank, label: "Is Cash or Bank account" },
              { checked: postsToCashBook, set: setPostsToCashBook, label: "Posts to Cash Book" },
              { checked: requiresSubLedger, set: setRequiresSubLedger, label: "Requires Sub-Ledger (party)" },
              { checked: allowDocAdjust, set: setAllowDocAdjust, label: "Allow Document Adjustment" },
            ].map((opt) => (
              <label
                key={opt.label}
                className="flex items-center gap-2.5 rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-700"
              >
                <input
                  type="checkbox"
                  checked={opt.checked}
                  onChange={(e) => opt.set(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand"
                />
                {opt.label}
              </label>
            ))}
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="text-sm font-medium text-slate-800">Status</label>
          <p className="mb-2 text-xs text-slate-500">Set active to make this ledger available for postings.</p>
          <div className="relative max-w-xs">
            <span
              className={`pointer-events-none absolute left-3.5 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full ${
                isActive ? "bg-emerald-500" : "bg-slate-400"
              }`}
            />
            <select
              value={isActive ? "ACTIVE" : "INACTIVE"}
              onChange={(e) => setIsActive(e.target.value === "ACTIVE")}
              className="w-full appearance-none rounded-lg border border-slate-200 py-2.5 pl-8 pr-10 text-sm text-slate-800 outline-none focus:border-brand focus:ring-1 focus:ring-brand"
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
            <ChevronDown size={16} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>
        </div>
      </div>

      <div className="my-6 border-t border-slate-200" />

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => router.push("/master/ledgers")}
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
          {submitting ? "Saving..." : "Save Ledger"}
        </button>
      </div>
    </form>
  );
}
