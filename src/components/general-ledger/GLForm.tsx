"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Layers, Network, Save } from "lucide-react";
import Combobox, { type ComboboxOption } from "@/components/shared/Combobox";
import {
  GL_TYPE_LIST,
  GL_TYPES,
  ACCOUNT_TYPES,
  type GLType,
  type AccountType,
} from "@/lib/constants";

type SubGroupOption = { id: number; code: string; description: string; isActive: boolean };
type AccountGroupOption = {
  id: number;
  code: string;
  description: string;
  type: AccountType;
  isActive: boolean;
  subGroups: SubGroupOption[];
};
type ParentOption = { id: number; code: string; name: string };

export type GLFormInitial = {
  id: number;
  code: string;
  name: string;
  glType: GLType;
  accountGroupId: number;
  accountSubGroupId: number;
  parentId: number | null;
  isCashOrBank: boolean;
  postsToCashBook: boolean;
  requiresSubLedger: boolean;
  allowDocAdjust: boolean;
  isActive: boolean;
};

export default function GLForm({ initial }: { initial?: GLFormInitial }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEdit = Boolean(initial);

  const [accountGroups, setAccountGroups] = useState<AccountGroupOption[]>([]);
  const [parents, setParents] = useState<ParentOption[]>([]);

  const [code, setCode] = useState(initial?.code ?? "");
  const [name, setName] = useState(initial?.name ?? "");
  const [glType, setGlType] = useState<GLType>(initial?.glType ?? "OTHER");
  const [accountGroupId, setAccountGroupId] = useState(initial ? String(initial.accountGroupId) : "");
  const [accountSubGroupId, setAccountSubGroupId] = useState(
    initial ? String(initial.accountSubGroupId) : ""
  );
  const [isCashOrBank, setIsCashOrBank] = useState(initial?.isCashOrBank ?? false);
  const [postsToCashBook, setPostsToCashBook] = useState(initial?.postsToCashBook ?? false);
  const [requiresSubLedger, setRequiresSubLedger] = useState(initial?.requiresSubLedger ?? false);
  const [allowDocAdjust, setAllowDocAdjust] = useState(initial?.allowDocAdjust ?? false);
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [parentId, setParentId] = useState(initial?.parentId ? String(initial.parentId) : "");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prefilledFromQuery, setPrefilledFromQuery] = useState(isEdit);

  useEffect(() => {
    fetch("/api/account-groups")
      .then((r) => r.json())
      .then((rows: AccountGroupOption[]) => setAccountGroups(rows))
      .catch(() => setAccountGroups([]));
    fetch("/api/general-ledgers")
      .then((r) => r.json())
      .then((rows: ParentOption[]) => setParents(rows))
      .catch(() => setParents([]));
  }, []);

  // If arriving via "New Ledger" from a sub-group's page (?accountSubGroupId=..),
  // preselect its group + sub-group once the groups have loaded.
  useEffect(() => {
    if (prefilledFromQuery || accountGroups.length === 0) return;
    const qSubGroupId = searchParams.get("accountSubGroupId");
    if (qSubGroupId) {
      const group = accountGroups.find((g) => g.subGroups.some((sg) => String(sg.id) === qSubGroupId));
      if (group) {
        setAccountGroupId(String(group.id));
        setAccountSubGroupId(qSubGroupId);
      }
    }
    setPrefilledFromQuery(true);
  }, [accountGroups, prefilledFromQuery, searchParams]);

  const selectedGroup = accountGroups.find((g) => String(g.id) === accountGroupId);
  const availableSubGroups = useMemo(
    () => (selectedGroup ? selectedGroup.subGroups.filter((sg) => sg.isActive) : []),
    [selectedGroup]
  );
  const parentOptions = useMemo(
    () => (isEdit ? parents.filter((p) => p.id !== initial!.id) : parents),
    [parents, isEdit, initial]
  );

  const accountGroupOptions: ComboboxOption[] = useMemo(
    () =>
      accountGroups.map((g) => ({
        value: String(g.id),
        label: `${g.code} — ${g.description}`,
        description: ACCOUNT_TYPES[g.type].label,
      })),
    [accountGroups]
  );
  const subGroupOptions: ComboboxOption[] = useMemo(
    () => availableSubGroups.map((sg) => ({ value: String(sg.id), label: `${sg.code} — ${sg.description}` })),
    [availableSubGroups]
  );
  const parentLedgerOptions: ComboboxOption[] = useMemo(
    () => parentOptions.map((p) => ({ value: String(p.id), label: `${p.code} — ${p.name}` })),
    [parentOptions]
  );

  function handleGroupChange(value: string) {
    setAccountGroupId(value);
    setAccountSubGroupId(""); // reset sub-group whenever the group changes
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!code.trim() || !name.trim() || !accountGroupId || !accountSubGroupId) {
      setError("GL Code, GL Name, Account Group, and Account Sub-Group are required.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(
        isEdit ? `/api/general-ledgers/${initial!.id}` : "/api/general-ledgers",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: code.trim(),
            name: name.trim(),
            glType,
            accountSubGroupId: Number(accountSubGroupId),
            parentId: parentId ? Number(parentId) : null,
            isCashOrBank,
            postsToCashBook,
            requiresSubLedger,
            allowDocAdjust,
            isActive,
          }),
        }
      );

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to save general ledger.");
      }

      router.push(isEdit ? `/master/ledgers/${initial!.id}` : "/master/ledgers");
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
        <p className="mt-1 text-sm text-slate-500">
          {isEdit ? "Update details of this general ledger." : "Provide details of the new general ledger account."}
        </p>
      </div>
      <div className="my-5 border-t border-slate-200" />

      {error && (
        <div className="mb-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="space-y-5">
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

        {/* GL Type */}
        <div>
          <label className="text-sm font-medium text-slate-800">GL Type</label>
          <p className="mb-2 text-xs text-slate-500">Classification used for posting rules.</p>
          <div className="relative max-w-xs">
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

        {/* Account Group */}
        <div>
          <label className="text-sm font-medium text-slate-800">
            Account Group <span className="text-rose-500">*</span>
          </label>
          <p className="mb-2 text-xs text-slate-500">Select the account group this ledger belongs to.</p>
          <Combobox
            options={accountGroupOptions}
            value={accountGroupId}
            onChange={handleGroupChange}
            icon={Network}
            placeholder={accountGroups.length === 0 ? "No account groups available — create one first" : "Search account groups..."}
            emptyMessage="No account groups match your search."
            aria-label="Account Group"
          />
        </div>

        {/* Account Sub-Group */}
        <div>
          <label className="text-sm font-medium text-slate-800">
            Account Sub-Group <span className="text-rose-500">*</span>
          </label>
          <p className="mb-2 text-xs text-slate-500">
            {accountGroupId ? "Select the sub-group this ledger belongs to." : "Select an Account Group first."}
          </p>
          <Combobox
            options={subGroupOptions}
            value={accountSubGroupId}
            onChange={setAccountSubGroupId}
            icon={Layers}
            disabled={!accountGroupId}
            placeholder={
              !accountGroupId
                ? "Select an Account Group first"
                : availableSubGroups.length === 0
                  ? "No sub-groups in this group — create one first"
                  : "Search sub-groups..."
            }
            emptyMessage="No sub-groups match your search."
            aria-label="Account Sub-Group"
          />
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

        {/* Parent ledger */}
        <div>
          <label className="text-sm font-medium text-slate-800">Parent Ledger</label>
          <p className="mb-2 text-xs text-slate-500">Optional — nests this ledger under another for hierarchy/roll-up.</p>
          <Combobox
            options={parentLedgerOptions}
            value={parentId}
            onChange={setParentId}
            placeholder="Search ledgers... (leave blank for top-level)"
            emptyMessage="No ledgers match your search."
            aria-label="Parent Ledger"
          />
        </div>
      </div>

      <div className="my-6 border-t border-slate-200" />

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => router.push(isEdit ? `/master/ledgers/${initial!.id}` : "/master/ledgers")}
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
          {submitting ? "Saving..." : isEdit ? "Update Ledger" : "Save Ledger"}
        </button>
      </div>
    </form>
  );
}
