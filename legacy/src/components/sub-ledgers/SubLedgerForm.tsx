"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronDown, BookOpen, Users, Save } from "lucide-react";
import type { RecordStatus } from "@/lib/constants";

type GeneralLedgerOption = { id: number; code: string; name: string };
type PartyOption = { id: number; code: string; name: string };

export type SubLedgerFormInitial = {
  id: number;
  code: string;
  name: string;
  generalLedgerId: number | null;
  partyId: number | null;
  status: RecordStatus;
};

export default function SubLedgerForm({ initial }: { initial?: SubLedgerFormInitial }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEdit = Boolean(initial);

  const [generalLedgers, setGeneralLedgers] = useState<GeneralLedgerOption[]>([]);
  const [parties, setParties] = useState<PartyOption[]>([]);

  const [code, setCode] = useState(initial?.code ?? "");
  const [name, setName] = useState(initial?.name ?? "");
  const [generalLedgerId, setGeneralLedgerId] = useState(
    initial ? (initial.generalLedgerId ? String(initial.generalLedgerId) : "") : searchParams.get("generalLedgerId") ?? ""
  );
  const [partyId, setPartyId] = useState(initial?.partyId ? String(initial.partyId) : "");
  const [status, setStatus] = useState<RecordStatus>(initial?.status ?? "ACTIVE");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/general-ledgers")
      .then((r) => r.json())
      .then((rows: GeneralLedgerOption[]) => setGeneralLedgers(rows))
      .catch(() => setGeneralLedgers([]));
    fetch("/api/parties")
      .then((r) => r.json())
      .then((rows: PartyOption[]) => setParties(rows))
      .catch(() => setParties([]));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!code.trim() || !name.trim()) {
      setError("Sub-Ledger Code and Sub-Ledger Name are required.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(
        isEdit ? `/api/sub-ledgers/${initial!.id}` : "/api/sub-ledgers",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: code.trim(),
            name: name.trim(),
            generalLedgerId: generalLedgerId ? Number(generalLedgerId) : null,
            partyId: partyId ? Number(partyId) : null,
            isActive: status === "ACTIVE",
          }),
        }
      );

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to save sub-ledger.");
      }

      router.push(isEdit ? `/master/sub-ledgers/${initial!.id}` : "/master/sub-ledgers");
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
        <h2 className="text-base font-semibold text-slate-900">Sub-Ledger Information</h2>
        <p className="mt-1 text-sm text-slate-500">
          {isEdit ? "Update details of this sub-ledger." : "Provide details of the new sub-ledger."}
        </p>
      </div>
      <div className="my-5 border-t border-slate-200" />

      {error && (
        <div className="mb-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="space-y-5">
        {/* Code / Name */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-slate-800">
              Sub-Ledger Code <span className="text-rose-500">*</span>
            </label>
            <p className="mb-2 text-xs text-slate-500">Unique code for this sub-ledger.</p>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="SL-1000"
              className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-800">
              Sub-Ledger Name <span className="text-rose-500">*</span>
            </label>
            <p className="mb-2 text-xs text-slate-500">Name of the sub-ledger account.</p>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Kathmandu Branch Debtors"
              className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
            />
          </div>
        </div>

        {/* General Ledger */}
        <div>
          <label className="text-sm font-medium text-slate-800">General Ledger</label>
          <p className="mb-2 text-xs text-slate-500">Optional — the ledger this sub-ledger provides detail for.</p>
          <div className="relative">
            <BookOpen size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-500" />
            <select
              value={generalLedgerId}
              onChange={(e) => setGeneralLedgerId(e.target.value)}
              className="w-full appearance-none rounded-lg border border-slate-200 py-2.5 pl-10 pr-10 text-sm text-slate-800 outline-none focus:border-brand focus:ring-1 focus:ring-brand"
            >
              <option value="">
                {generalLedgers.length === 0 ? "No general ledgers available" : "None"}
              </option>
              {generalLedgers.map((gl) => (
                <option key={gl.id} value={gl.id}>
                  {gl.code} — {gl.name}
                </option>
              ))}
            </select>
            <ChevronDown size={16} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>
        </div>

        {/* Party */}
        <div>
          <label className="text-sm font-medium text-slate-800">Party</label>
          <p className="mb-2 text-xs text-slate-500">Optional — the customer/vendor party this sub-ledger tracks.</p>
          <div className="relative">
            <Users size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-500" />
            <select
              value={partyId}
              onChange={(e) => setPartyId(e.target.value)}
              className="w-full appearance-none rounded-lg border border-slate-200 py-2.5 pl-10 pr-10 text-sm text-slate-800 outline-none focus:border-brand focus:ring-1 focus:ring-brand"
            >
              <option value="">{parties.length === 0 ? "No parties available" : "None"}</option>
              {parties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} — {p.name}
                </option>
              ))}
            </select>
            <ChevronDown size={16} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>
        </div>

        {/* Status */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-slate-800">Status</label>
            <p className="mb-2 text-xs text-slate-500">Set active to make this sub-ledger available for postings.</p>
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
          onClick={() => router.push(isEdit ? `/master/sub-ledgers/${initial!.id}` : "/master/sub-ledgers")}
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
          {submitting ? "Saving..." : isEdit ? "Update Sub-Ledger" : "Save Sub-Ledger"}
        </button>
      </div>
    </form>
  );
}
