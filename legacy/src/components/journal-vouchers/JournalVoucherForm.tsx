"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Hash,
  MapPin,
  RefreshCw,
  Save,
  Plus,
  Trash2,
  Info,
  CheckCircle2,
  AlertTriangle,
  Undo2,
} from "lucide-react";
import Combobox, { type ComboboxOption } from "@/components/shared/Combobox";

type GeneralLedgerOption = { id: number; code: string; name: string; groupPath: string };
type AgentOption = { id: number; code: string; name: string };
type BranchOption = { id: number; code: string; name: string; isHeadOffice: boolean };
type ReversalCandidate = { id: number; voucherNumber: string; voucherDate: string; branchId: number };

type LineRow = {
  generalLedgerId: string;
  debit: string;
  credit: string;
  narration: string;
  agentId: string;
};

const emptyLine = (): LineRow => ({ generalLedgerId: "", debit: "", credit: "", narration: "", agentId: "" });

export type JournalVoucherFormInitial = {
  id: number;
  branchId: number;
  voucherNumber: string;
  voucherDate: string; // yyyy-mm-dd
  remarks: string;
  reversalOfId: number | null;
  lines: LineRow[];
};

export default function JournalVoucherForm({
  initial,
  branches,
  defaultBranchId,
  fiscalYearCode,
}: {
  initial?: JournalVoucherFormInitial;
  branches: BranchOption[];
  /** The header switcher's current branch. Null means "All Branches" — a specific one must still be picked to save. */
  defaultBranchId: number | null;
  /** Read-only context display, from the header switcher — not a field the form submits. */
  fiscalYearCode: string | null;
}) {
  const router = useRouter();
  const isEdit = Boolean(initial);

  const [branchId, setBranchId] = useState(() => {
    if (initial) return String(initial.branchId);
    if (defaultBranchId !== null) return String(defaultBranchId);
    // Header is on "All Branches" — a specific branch is still required to
    // save, so pick the most sensible default rather than leaving it
    // blank: the only branch if there's just one, otherwise Head Office.
    if (branches.length === 1) return String(branches[0].id);
    const headOffice = branches.find((b) => b.isHeadOffice);
    return headOffice ? String(headOffice.id) : "";
  });
  // True only when we picked a default the person hasn't confirmed yet —
  // drives the small "defaulted to Head Office" hint under the field.
  const [branchAutoSelected, setBranchAutoSelected] = useState(
    !initial && defaultBranchId === null && branches.length !== 1 && branches.some((b) => b.isHeadOffice)
  );

  const [voucherNumber, setVoucherNumber] = useState(initial?.voucherNumber ?? "");
  const [voucherNumberTouched, setVoucherNumberTouched] = useState(isEdit);
  const [fetchingNumber, setFetchingNumber] = useState(false);

  const [voucherDate, setVoucherDate] = useState(initial?.voucherDate ?? todayIso());
  const [remarks, setRemarks] = useState(initial?.remarks ?? "");

  // "Entry Type" isn't its own schema column — it just decides whether this
  // voucher links back to another one via JournalVoucher.reversalOfId.
  const [entryType, setEntryType] = useState<"NORMAL" | "REVERSAL">(
    initial?.reversalOfId ? "REVERSAL" : "NORMAL"
  );
  const [reversalOfId, setReversalOfId] = useState(initial?.reversalOfId ? String(initial.reversalOfId) : "");
  const [reversalCandidates, setReversalCandidates] = useState<ReversalCandidate[]>([]);

  const [lines, setLines] = useState<LineRow[]>(initial?.lines?.length ? initial.lines : [emptyLine(), emptyLine()]);

  const [generalLedgers, setGeneralLedgers] = useState<GeneralLedgerOption[]>([]);
  const [agents, setAgents] = useState<AgentOption[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/general-ledgers")
      .then((r) => r.json())
      .then((rows: GeneralLedgerOption[]) => setGeneralLedgers(Array.isArray(rows) ? rows : []))
      .catch(() => setGeneralLedgers([]));
    fetch("/api/agents")
      .then((r) => r.json())
      .then((rows: AgentOption[]) => setAgents(Array.isArray(rows) ? rows : []))
      .catch(() => setAgents([]));
  }, []);

  // Only fetched once "Reversal" is actually chosen — no point loading the
  // whole voucher history for the common (Normal) case.
  useEffect(() => {
    if (entryType !== "REVERSAL" || reversalCandidates.length > 0) return;
    fetch("/api/journal-vouchers")
      .then((r) => r.json())
      .then((rows: (ReversalCandidate & { isPosted: boolean })[]) =>
        setReversalCandidates(
          Array.isArray(rows)
            ? rows.filter((v) => v.isPosted && v.id !== initial?.id).map((v) => ({ id: v.id, voucherNumber: v.voucherNumber, voucherDate: v.voucherDate, branchId: v.branchId }))
            : []
        )
      )
      .catch(() => setReversalCandidates([]));
  }, [entryType, reversalCandidates.length, initial?.id]);

  // Auto-fills the next voucher number for the chosen branch, as long as
  // the person hasn't typed their own — matches the "Auto" badge in the
  // reference design. Skipped entirely in edit mode.
  useEffect(() => {
    if (isEdit || voucherNumberTouched || !branchId) return;
    setFetchingNumber(true);
    fetch(`/api/journal-vouchers/next-number?branchId=${branchId}`)
      .then((r) => r.json())
      .then((data: { voucherNumber?: string }) => {
        if (data.voucherNumber) setVoucherNumber(data.voucherNumber);
      })
      .catch(() => {})
      .finally(() => setFetchingNumber(false));
  }, [branchId, isEdit, voucherNumberTouched]);

  const glOptions: ComboboxOption[] = useMemo(
    () => generalLedgers.map((gl) => ({ value: String(gl.id), label: `${gl.code} — ${gl.name}`, description: gl.groupPath })),
    [generalLedgers]
  );
  const agentOptions: ComboboxOption[] = useMemo(
    () => agents.map((a) => ({ value: String(a.id), label: a.name, description: a.code })),
    [agents]
  );
  const reversalOptions: ComboboxOption[] = useMemo(
    () =>
      reversalCandidates
        .filter((v) => !branchId || String(v.branchId) === branchId)
        .map((v) => ({ value: String(v.id), label: v.voucherNumber, description: v.voucherDate })),
    [reversalCandidates, branchId]
  );

  function updateLine(i: number, patch: Partial<LineRow>) {
    setLines((prev) => prev.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
  }

  function handleDebitChange(i: number, next: string) {
    updateLine(i, { debit: next, credit: next.trim() !== "" && Number(next) > 0 ? "" : lines[i].credit });
  }

  function handleCreditChange(i: number, next: string) {
    updateLine(i, { credit: next, debit: next.trim() !== "" && Number(next) > 0 ? "" : lines[i].debit });
  }

  function addLine() {
    setLines((prev) => [...prev, emptyLine()]);
  }

  function removeLine(i: number) {
    setLines((prev) => prev.filter((_, idx) => idx !== i));
  }

  function handleLastCellKeyDown(e: React.KeyboardEvent, i: number) {
    if (e.key === "Enter" && i === lines.length - 1) {
      e.preventDefault();
      addLine();
    }
  }

  const totals = useMemo(() => {
    let debit = 0;
    let credit = 0;
    for (const row of lines) {
      debit += Number(row.debit || 0);
      credit += Number(row.credit || 0);
    }
    return { debit, credit, difference: debit - credit };
  }, [lines]);

  const balanced = lines.length >= 2 && totals.debit > 0 && Math.round(totals.difference * 100) === 0;

  function validate(): string | null {
    if (!branchId) return "Branch is required.";
    if (!voucherNumber.trim()) return "Voucher No. is required.";
    if (!voucherDate) return "Date is required.";
    if (entryType === "REVERSAL" && !reversalOfId) return "Select the voucher this entry reverses.";
    if (lines.length < 2) return "A journal voucher needs at least two lines.";
    for (const row of lines) {
      if (!row.generalLedgerId) return "Every line needs an Account Head.";
      const debit = Number(row.debit || 0);
      const credit = Number(row.credit || 0);
      if (debit > 0 && credit > 0) return "Each line can carry either a Debit or a Credit, not both.";
      if (debit === 0 && credit === 0) return "Every line needs a Debit or a Credit amount.";
    }
    if (!balanced) return "Total Debit must equal Total Credit before saving.";
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(isEdit ? `/api/journal-vouchers/${initial!.id}` : "/api/journal-vouchers", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branchId: Number(branchId),
          voucherNumber: voucherNumber.trim(),
          voucherDate,
          remarks: remarks.trim(),
          reversalOfId: entryType === "REVERSAL" && reversalOfId ? Number(reversalOfId) : null,
          lines: lines.map((row) => ({
            generalLedgerId: Number(row.generalLedgerId),
            debit: Number(row.debit || 0),
            credit: Number(row.credit || 0),
            narration: row.narration.trim(),
            agentId: row.agentId ? Number(row.agentId) : null,
          })),
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to save journal voucher.");
      }

      const saved = await res.json();
      router.push(`/transactions/journal-voucher/${saved.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  // Ctrl/Cmd+S saves, Esc cancels — the two shortcuts advertised in the
  // hint bar below that don't already come for free from Combobox's own
  // arrow-key / Enter handling.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        (document.getElementById("journal-voucher-form") as HTMLFormElement | null)?.requestSubmit();
      } else if (e.key === "Escape") {
        router.push(isEdit ? `/transactions/journal-voucher/${initial!.id}` : "/transactions/journal-voucher");
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit]);

  const inputClass =
    "w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand";
  const labelClass = "text-sm font-medium text-slate-800";
  const hintClass = "mb-2 text-xs text-slate-500";
  const cellInputClass =
    "w-full rounded-md border border-slate-200 px-2.5 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand";

  return (
    <form id="journal-voucher-form" onSubmit={handleSubmit}>
      {error && (
        <div className="mb-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* Voucher header */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Journal Voucher</h2>
            <p className="mt-1 text-sm text-slate-500">Record your manual journal entries.</p>
          </div>
          {fiscalYearCode && (
            <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
              FY {fiscalYearCode}
            </div>
          )}
        </div>

        <div className="my-5 border-t border-slate-200" />

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div>
            <label className={labelClass}>
              Voucher No. <span className="text-rose-500">*</span>
            </label>
            <p className={hintClass}>Unique within this branch.</p>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Hash size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={voucherNumber}
                  onChange={(e) => {
                    setVoucherNumber(e.target.value);
                    setVoucherNumberTouched(true);
                  }}
                  placeholder="JV-2026-0001"
                  className={`${inputClass} pl-10`}
                />
              </div>
              {!isEdit && (
                <button
                  type="button"
                  onClick={() => {
                    setVoucherNumberTouched(false);
                  }}
                  disabled={!branchId || fetchingNumber}
                  title="Regenerate next number"
                  className="flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  <RefreshCw size={13} className={fetchingNumber ? "animate-spin" : ""} />
                  Auto
                </button>
              )}
            </div>
          </div>

          <div>
            <label className={labelClass}>
              Date <span className="text-rose-500">*</span>
            </label>
            <p className={hintClass}>Posting date for this voucher.</p>
            <input
              type="date"
              value={voucherDate}
              onChange={(e) => setVoucherDate(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>
              Branch <span className="text-rose-500">*</span>
            </label>
            <p className={hintClass}>
              {branchAutoSelected ? "Defaulted to Head Office — change if this voucher is for another branch." : "Which branch this voucher posts to."}
            </p>
            <Combobox
              options={branches.map((b) => ({ value: String(b.id), label: b.name, description: b.code }))}
              value={branchId}
              onChange={(v) => {
                setBranchId(v);
                setBranchAutoSelected(false);
                setVoucherNumberTouched(false);
              }}
              icon={MapPin}
              placeholder="Search branches..."
              emptyMessage="No branches available"
            />
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div>
            <label className={labelClass}>Entry Type</label>
            <p className={hintClass}>Reversal links back to the voucher it undoes.</p>
            <div className="relative">
              <select
                value={entryType}
                onChange={(e) => {
                  const next = e.target.value as "NORMAL" | "REVERSAL";
                  setEntryType(next);
                  if (next === "NORMAL") setReversalOfId("");
                }}
                className={`${inputClass} appearance-none pr-9`}
              >
                <option value="NORMAL">Normal</option>
                <option value="REVERSAL">Reversal</option>
              </select>
              <Undo2 size={15} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
          </div>

          {entryType === "REVERSAL" && (
            <div className="sm:col-span-2">
              <label className={labelClass}>
                Reverses Voucher <span className="text-rose-500">*</span>
              </label>
              <p className={hintClass}>Only posted vouchers on this branch can be reversed.</p>
              <Combobox
                options={reversalOptions}
                value={reversalOfId}
                onChange={setReversalOfId}
                icon={Undo2}
                placeholder="Search voucher no..."
                emptyMessage="No posted vouchers to reverse on this branch"
              />
            </div>
          )}
        </div>

        <div className="mt-5 flex items-start gap-2.5 rounded-lg border border-blue-100 bg-blue-50/50 p-4">
          <Info size={17} className="mt-0.5 shrink-0 text-blue-600" />
          <p className="text-sm leading-relaxed text-slate-600">
            Use a Journal Voucher to record adjustments, accruals, prepayments and other non-cash
            transactions. Cash or bank movements belong on a Cash / Bank Voucher instead.
          </p>
        </div>
      </div>

      {/* Journal entries grid */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-card">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Journal Entries</h2>
            <p className="mt-1 text-xs text-slate-500">
              Use ↑ / ↓ to browse Account Head or Agent options · Enter on the last row adds a line
            </p>
          </div>
          <div
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
              balanced ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
            }`}
          >
            {balanced ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
            Dr {balanced ? "=" : "≠"} Cr
          </div>
        </div>

        <div className="my-5 border-t border-slate-200" />

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-separate border-spacing-0">
            <thead>
              <tr className="text-left text-xs font-medium text-slate-500">
                <th className="w-8 pb-2">#</th>
                <th className="pb-2 pr-3">Account Head</th>
                <th className="w-40 pb-2 pr-3">Agent</th>
                <th className="pb-2 pr-3">Description</th>
                <th className="w-36 pb-2 pr-3 text-right">Debit</th>
                <th className="w-36 pb-2 pr-3 text-right">Credit</th>
                <th className="w-10 pb-2"></th>
              </tr>
            </thead>
            <tbody>
              {lines.map((row, i) => (
                <tr key={i} className="border-t border-slate-100 align-top">
                  <td className="py-2.5 pr-3 pt-4 text-sm text-slate-400">{i + 1}</td>
                  <td className="min-w-[220px] py-2.5 pr-3">
                    <Combobox
                      options={glOptions}
                      value={row.generalLedgerId}
                      onChange={(v) => updateLine(i, { generalLedgerId: v })}
                      placeholder="Search account..."
                      emptyMessage="No ledgers match your search."
                      aria-label={`Account Head, line ${i + 1}`}
                    />
                  </td>
                  <td className="min-w-[160px] py-2.5 pr-3">
                    <Combobox
                      options={agentOptions}
                      value={row.agentId}
                      onChange={(v) => updateLine(i, { agentId: v })}
                      placeholder="—"
                      emptyMessage="No agents match your search."
                      aria-label={`Agent, line ${i + 1}`}
                    />
                  </td>
                  <td className="min-w-[180px] py-2.5 pr-3">
                    <input
                      value={row.narration}
                      onChange={(e) => updateLine(i, { narration: e.target.value })}
                      placeholder="Line description"
                      className={cellInputClass}
                    />
                  </td>
                  <td className="py-2.5 pr-3">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={row.debit}
                      onChange={(e) => handleDebitChange(i, e.target.value)}
                      placeholder="0.00"
                      className={`${cellInputClass} text-right tabular-nums`}
                    />
                  </td>
                  <td className="py-2.5 pr-3">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={row.credit}
                      onChange={(e) => handleCreditChange(i, e.target.value)}
                      onKeyDown={(e) => handleLastCellKeyDown(e, i)}
                      placeholder="0.00"
                      className={`${cellInputClass} text-right tabular-nums`}
                    />
                  </td>
                  <td className="py-2.5 pt-4 text-right">
                    <button
                      type="button"
                      onClick={() => removeLine(i)}
                      className="rounded-md p-1.5 text-rose-500 hover:bg-rose-50"
                      aria-label={`Remove line ${i + 1}`}
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button
          type="button"
          onClick={addLine}
          className="mt-3 flex items-center gap-1.5 text-sm font-medium text-brand hover:underline"
        >
          <Plus size={15} />
          Add Line
        </button>
      </div>

      {/* Notes + totals */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card">
          <label className={labelClass}>Notes (Optional)</label>
          <p className={hintClass}>Any additional context for this voucher.</p>
          <textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value.slice(0, 1024))}
            rows={5}
            maxLength={1024}
            placeholder="Add any additional notes..."
            className={inputClass}
          />
          <div className="mt-1.5 text-right text-xs text-slate-400">{remarks.length}/1024</div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card">
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Total Debit</span>
              <span className="font-semibold tabular-nums text-emerald-600">{totals.debit.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Total Credit</span>
              <span className="font-semibold tabular-nums text-blue-600">{totals.credit.toFixed(2)}</span>
            </div>
            <div className="border-t border-slate-200 pt-3" />
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Difference</span>
              <span className="font-semibold tabular-nums text-slate-900">{Math.abs(totals.difference).toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between pt-1">
              <span
                className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                  balanced ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                }`}
              >
                {balanced ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
                {balanced ? "Balanced" : "Unbalanced"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
          <span><kbd className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono">Ctrl</kbd> + <kbd className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono">S</kbd> Save</span>
          <span><kbd className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono">Esc</kbd> Cancel</span>
          <span><kbd className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono">Enter</kbd> on last row adds a line</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() =>
              router.push(isEdit ? `/transactions/journal-voucher/${initial!.id}` : "/transactions/journal-voucher")
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
            {submitting ? "Saving..." : isEdit ? "Update Voucher" : "Save Voucher"}
          </button>
        </div>
      </div>
    </form>
  );
}

function todayIso(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}
