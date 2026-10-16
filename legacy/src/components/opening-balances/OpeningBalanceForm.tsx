"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { BookOpen, Layers, MapPin, Save, CalendarRange } from "lucide-react";
import Combobox from "@/components/shared/Combobox";

type GeneralLedgerOption = { id: number; code: string; name: string };
type SubLedgerOption = { id: number; code: string; name: string; generalLedgerId: number | null };
type BranchOption = { id: number; code: string; name: string };

export type OpeningBalanceFormInitial = {
  id: number;
  branchId: number;
  generalLedgerId: number;
  subLedgerId: number | null;
  debit: string;
  credit: string;
  remarks: string;
};

export default function OpeningBalanceForm({
  initial,
  branches,
  fiscalYearCode,
  defaultBranchId,
}: {
  initial?: OpeningBalanceFormInitial;
  branches: BranchOption[];
  /** Fiscal year comes from the header switcher, not this form — shown read-only for context. */
  fiscalYearCode: string;
  /** The switcher's current branch, used as the default when creating. Null means "All Branches". */
  defaultBranchId: number | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEdit = Boolean(initial);

  const [generalLedgers, setGeneralLedgers] = useState<GeneralLedgerOption[]>([]);
  const [subLedgers, setSubLedgers] = useState<SubLedgerOption[]>([]);

  const [branchId, setBranchId] = useState(
    initial
      ? String(initial.branchId)
      : defaultBranchId !== null
        ? String(defaultBranchId)
        : branches.length === 1
          ? String(branches[0].id)
          : ""
  );
  const [generalLedgerId, setGeneralLedgerId] = useState(
    initial ? String(initial.generalLedgerId) : searchParams.get("generalLedgerId") ?? ""
  );
  const [subLedgerId, setSubLedgerId] = useState(initial?.subLedgerId ? String(initial.subLedgerId) : "");
  const [debit, setDebit] = useState(initial?.debit ?? "");
  const [credit, setCredit] = useState(initial?.credit ?? "");
  const [remarks, setRemarks] = useState(initial?.remarks ?? "");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/general-ledgers")
      .then((r) => r.json())
      .then((rows: GeneralLedgerOption[]) => setGeneralLedgers(Array.isArray(rows) ? rows : []))
      .catch(() => setGeneralLedgers([]));
    fetch("/api/sub-ledgers")
      .then((r) => r.json())
      .then((rows: SubLedgerOption[]) => setSubLedgers(Array.isArray(rows) ? rows : []))
      .catch(() => setSubLedgers([]));
  }, []);

  // A sub-ledger is a breakdown *under* one ledger, so only offer those
  // attached to the chosen ledger (plus unattached ones, which are usable
  // anywhere). Picking a different ledger clears a now-invalid sub-ledger.
  const subLedgerOptions = useMemo(() => {
    if (!generalLedgerId) return [];
    return subLedgers.filter(
      (sl) => sl.generalLedgerId === null || String(sl.generalLedgerId) === generalLedgerId
    );
  }, [subLedgers, generalLedgerId]);

  function handleGeneralLedgerChange(next: string) {
    setGeneralLedgerId(next);
    if (subLedgerId) {
      const stillValid = subLedgers.some(
        (sl) => String(sl.id) === subLedgerId && (sl.generalLedgerId === null || String(sl.generalLedgerId) === next)
      );
      if (!stillValid) setSubLedgerId("");
    }
  }

  // Entering one side clears the other, which enforces the same rule the API
  // applies (exactly one of debit/credit) at the point of typing rather than
  // only on submit.
  function handleDebitChange(next: string) {
    setDebit(next);
    if (next.trim() !== "" && Number(next) > 0) setCredit("");
  }

  function handleCreditChange(next: string) {
    setCredit(next);
    if (next.trim() !== "" && Number(next) > 0) setDebit("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!branchId) {
      setError("Branch is required.");
      return;
    }
    if (!generalLedgerId) {
      setError("General Ledger is required.");
      return;
    }

    const debitValue = debit.trim() === "" ? 0 : Number(debit);
    const creditValue = credit.trim() === "" ? 0 : Number(credit);

    if (Number.isNaN(debitValue) || Number.isNaN(creditValue)) {
      setError("Debit and Credit must be valid numbers.");
      return;
    }
    if (debitValue > 0 && creditValue > 0) {
      setError("Enter either a Debit or a Credit amount, not both.");
      return;
    }
    if (debitValue === 0 && creditValue === 0) {
      setError("Enter a Debit or a Credit amount.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(
        isEdit ? `/api/opening-balances/${initial!.id}` : "/api/opening-balances",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            branchId: Number(branchId),
            generalLedgerId: Number(generalLedgerId),
            subLedgerId: subLedgerId ? Number(subLedgerId) : null,
            debit: debitValue,
            credit: creditValue,
            remarks: remarks.trim(),
          }),
        }
      );

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to save opening balance.");
      }

      router.push(isEdit ? `/master/opening-balance/${initial!.id}` : "/master/opening-balance");
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
        <h2 className="text-base font-semibold text-slate-900">Opening Balance Information</h2>
        <p className="mt-1 text-sm text-slate-500">
          {isEdit ? "Update this opening balance entry." : "Record an opening balance for a ledger."}
        </p>
      </div>
      <div className="my-5 border-t border-slate-200" />

      {error && (
        <div className="mb-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="space-y-5">
        {/* Fiscal year (read-only) / Branch */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-slate-800">Fiscal Year</label>
            <p className="mb-2 text-xs text-slate-500">Set from the header switcher, not editable here.</p>
            <div className="relative">
              <CalendarRange size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={fiscalYearCode}
                readOnly
                disabled
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3.5 text-sm text-slate-500 outline-none"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-800">
              Branch <span className="text-rose-500">*</span>
            </label>
            <p className="mb-2 text-xs text-slate-500">Branch this opening balance belongs to.</p>
            <Combobox
              options={branches.map((b) => ({ value: String(b.id), label: b.name, description: b.code }))}
              value={branchId}
              onChange={setBranchId}
              icon={MapPin}
              placeholder="Search branches..."
              emptyMessage="No branches available"
            />
          </div>
        </div>

        {/* General Ledger */}
        <div>
          <label className="text-sm font-medium text-slate-800">
            General Ledger <span className="text-rose-500">*</span>
          </label>
          <p className="mb-2 text-xs text-slate-500">The account this opening balance is recorded against.</p>
          <Combobox
            options={generalLedgers.map((gl) => ({
              value: String(gl.id),
              label: gl.name,
              description: gl.code,
            }))}
            value={generalLedgerId}
            onChange={handleGeneralLedgerChange}
            icon={BookOpen}
            placeholder="Search ledgers..."
            emptyMessage="No general ledgers available"
          />
        </div>

        {/* Sub-Ledger */}
        <div>
          <label className="text-sm font-medium text-slate-800">Sub-Ledger</label>
          <p className="mb-2 text-xs text-slate-500">
            Optional — a narrower breakdown under the selected ledger.
            {!generalLedgerId && " Pick a general ledger first."}
          </p>
          <Combobox
            options={subLedgerOptions.map((sl) => ({
              value: String(sl.id),
              label: sl.name,
              description: sl.code,
            }))}
            value={subLedgerId}
            onChange={setSubLedgerId}
            icon={Layers}
            disabled={!generalLedgerId}
            placeholder="Search sub-ledgers..."
            emptyMessage="No sub-ledgers for this ledger"
          />
        </div>

        {/* Debit / Credit */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-slate-800">Debit</label>
            <p className="mb-2 text-xs text-slate-500">Leave blank if this is a credit balance.</p>
            <input
              type="number"
              step="0.000001"
              min="0"
              value={debit}
              onChange={(e) => handleDebitChange(e.target.value)}
              placeholder="0.00"
              className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-right text-sm tabular-nums outline-none focus:border-brand focus:ring-1 focus:ring-brand"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-800">Credit</label>
            <p className="mb-2 text-xs text-slate-500">Leave blank if this is a debit balance.</p>
            <input
              type="number"
              step="0.000001"
              min="0"
              value={credit}
              onChange={(e) => handleCreditChange(e.target.value)}
              placeholder="0.00"
              className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-right text-sm tabular-nums outline-none focus:border-brand focus:ring-1 focus:ring-brand"
            />
          </div>
        </div>

        {/* Remarks */}
        <div>
          <label className="text-sm font-medium text-slate-800">Remarks</label>
          <p className="mb-2 text-xs text-slate-500">Optional note about where this balance came from.</p>
          <textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="Migrated from previous accounting system"
            className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
          />
        </div>
      </div>

      <div className="my-6 border-t border-slate-200" />

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() =>
            router.push(isEdit ? `/master/opening-balance/${initial!.id}` : "/master/opening-balance")
          }
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
          {submitting ? "Saving..." : isEdit ? "Update Opening Balance" : "Save Opening Balance"}
        </button>
      </div>
    </form>
  );
}
