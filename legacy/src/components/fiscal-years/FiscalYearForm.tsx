"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronDown, Save, Star, Lock, AlertTriangle } from "lucide-react";
import type { RecordStatus } from "@/lib/constants";

export type FiscalYearFormInitial = {
  id: number;
  code: string;
  startDate: string; // ISO "YYYY-MM-DD"
  endDate: string;
  isCurrent: boolean;
  isClosed: boolean;
  isOpeningBalanceLocked: boolean;
  status: RecordStatus;
};

export default function FiscalYearForm({ initial }: { initial?: FiscalYearFormInitial }) {
  const router = useRouter();
  const isEdit = Boolean(initial);
  const [code, setCode] = useState(initial?.code ?? "");
  const [startDate, setStartDate] = useState(initial?.startDate ?? "");
  const [endDate, setEndDate] = useState(initial?.endDate ?? "");
  const [isCurrent, setIsCurrent] = useState(initial?.isCurrent ?? false);
  const [isClosed, setIsClosed] = useState(initial?.isClosed ?? false);
  const [isOpeningBalanceLocked, setIsOpeningBalanceLocked] = useState(initial?.isOpeningBalanceLocked ?? false);
  const [status, setStatus] = useState<RecordStatus>(initial?.status ?? "ACTIVE");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!code.trim() || !startDate || !endDate) {
      setError("Code, Start Date, and End Date are required.");
      return;
    }
    if (new Date(endDate) <= new Date(startDate)) {
      setError("End Date must be after Start Date.");
      return;
    }
    if (isCurrent && isClosed) {
      setError("A fiscal year can't be both current and closed at the same time.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(isEdit ? `/api/fiscal-years/${initial!.id}` : "/api/fiscal-years", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: code.trim(),
          startDate,
          endDate,
          isCurrent,
          isClosed,
          isOpeningBalanceLocked,
          isActive: status === "ACTIVE",
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to save fiscal year.");
      }

      router.push(isEdit ? `/master/fiscal-years/${initial!.id}` : "/master/fiscal-years");
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
        <h2 className="text-base font-semibold text-slate-900">Fiscal Year Information</h2>
        <p className="mt-1 text-sm text-slate-500">
          {isEdit ? "Update details of this fiscal year." : "Provide details of the new fiscal year."}
        </p>
      </div>
      <div className="my-5 border-t border-slate-200" />

      {error && (
        <div className="mb-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="space-y-5">
        <div>
          <label className="text-sm font-medium text-slate-800">
            Code <span className="text-rose-500">*</span>
          </label>
          <p className="mb-2 text-xs text-slate-500">Display label for this year, e.g. 2082/083.</p>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="2082/083"
            className="w-full max-w-xs rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
          />
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-slate-800">
              Start Date <span className="text-rose-500">*</span>
            </label>
            <p className="mb-2 text-xs text-slate-500">First day of this fiscal year.</p>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-800">
              End Date <span className="text-rose-500">*</span>
            </label>
            <p className="mb-2 text-xs text-slate-500">Last day of this fiscal year.</p>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
            />
          </div>
        </div>

        <div className="border-t border-slate-200" />

        {/* Workflow flags */}
        <div>
          <div className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-slate-900">
            <Star size={15} className="text-blue-500" />
            Workflow
          </div>
          <div className="space-y-4">
            <div>
              <label className="flex items-center gap-2.5 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={isCurrent}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setIsCurrent(checked);
                    if (checked) setIsClosed(false);
                  }}
                  className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand"
                />
                Current fiscal year
              </label>
              <p className="mt-1.5 text-xs text-slate-500">
                Only one fiscal year per company can be current — setting this clears it from any other year, and
                the header switcher defaults new transactions to it.
              </p>
            </div>

            <div>
              <label className="flex items-center gap-2.5 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={isClosed}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setIsClosed(checked);
                    if (checked) setIsCurrent(false);
                  }}
                  className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand"
                />
                Closed
              </label>
              <p className="mt-1.5 text-xs text-slate-500">
                A year can&apos;t be both closed and current — marking it closed clears the current flag.
              </p>
            </div>

            <div>
              <label className="flex items-center gap-2.5 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={isOpeningBalanceLocked}
                  onChange={(e) => setIsOpeningBalanceLocked(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand"
                />
                <span className="flex items-center gap-1.5">
                  <Lock size={13} className="text-amber-600" />
                  Lock opening balances
                </span>
              </label>
              <p className="mt-1.5 text-xs text-slate-500">
                Prevents every opening balance row for this year from being added, changed, or removed.
              </p>
            </div>

            {(isClosed || isOpeningBalanceLocked) && (
              <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs text-amber-800">
                <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                <span>
                  {isClosed && isOpeningBalanceLocked
                    ? "This year will be closed and its opening balances locked."
                    : isClosed
                      ? "This year will be marked closed."
                      : "Opening balances for this year will be locked."}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-slate-200" />

        <div>
          <label className="text-sm font-medium text-slate-800">Status</label>
          <p className="mb-2 text-xs text-slate-500">Set active to make this year selectable in the switcher.</p>
          <div className="relative max-w-xs">
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

      <div className="my-6 border-t border-slate-200" />

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => router.push(isEdit ? `/master/fiscal-years/${initial!.id}` : "/master/fiscal-years")}
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
          {submitting ? "Saving..." : isEdit ? "Update Fiscal Year" : "Save Fiscal Year"}
        </button>
      </div>
    </form>
  );
}
