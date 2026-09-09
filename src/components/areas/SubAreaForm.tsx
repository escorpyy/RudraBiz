"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronDown, MapPinned, Save } from "lucide-react";
import type { RecordStatus } from "@/lib/constants";

type AreaOption = { id: number; code: string; name: string; isActive: boolean };

export type SubAreaFormInitial = {
  id: number;
  areaId: number;
  code: string;
  name: string;
  shortName: string;
  status: RecordStatus;
};

export default function SubAreaForm({ initial }: { initial?: SubAreaFormInitial }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEdit = Boolean(initial);

  const [areas, setAreas] = useState<AreaOption[]>([]);
  const [areaId, setAreaId] = useState(
    initial ? String(initial.areaId) : searchParams.get("areaId") ?? ""
  );
  const [code, setCode] = useState(initial?.code ?? "");
  const [name, setName] = useState(initial?.name ?? "");
  const [shortName, setShortName] = useState(initial?.shortName ?? "");
  const [status, setStatus] = useState<RecordStatus>(initial?.status ?? "ACTIVE");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/areas")
      .then((r) => r.json())
      .then((rows: AreaOption[]) => setAreas(rows.filter((a) => a.isActive)))
      .catch(() => setAreas([]));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!areaId || !code.trim() || !name.trim() || !shortName.trim()) {
      setError("Area, Sub-Area Code, Sub-Area Name, and Short Name are required.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(isEdit ? `/api/sub-areas/${initial!.id}` : "/api/sub-areas", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          areaId: Number(areaId),
          code: code.trim(),
          name: name.trim(),
          shortName: shortName.trim(),
          isActive: status === "ACTIVE",
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to save sub-area.");
      }

      router.push(isEdit ? `/master/areas/sub-areas/${initial!.id}` : "/master/areas/sub-areas");
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
        <h2 className="text-base font-semibold text-slate-900">Sub-Area Information</h2>
        <p className="mt-1 text-sm text-slate-500">
          {isEdit ? "Update details of this sub-area." : "Provide details of the new sub-area."}
        </p>
      </div>
      <div className="my-5 border-t border-slate-200" />

      {error && (
        <div className="mb-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="space-y-5">
        {/* Area */}
        <div>
          <label className="text-sm font-medium text-slate-800">
            Area <span className="text-rose-500">*</span>
          </label>
          <p className="mb-2 text-xs text-slate-500">Select the area this sub-area belongs to.</p>
          <div className="relative">
            <MapPinned size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-500" />
            <select
              value={areaId}
              onChange={(e) => setAreaId(e.target.value)}
              className="w-full appearance-none rounded-lg border border-slate-200 py-2.5 pl-10 pr-10 text-sm text-slate-800 outline-none focus:border-brand focus:ring-1 focus:ring-brand"
            >
              <option value="">
                {areas.length === 0 ? "No areas available — create one first" : "Select an area"}
              </option>
              {areas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.code} — {a.name}
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
              Sub-Area Code <span className="text-rose-500">*</span>
            </label>
            <p className="mb-2 text-xs text-slate-500">Unique code within this area.</p>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="A-001-1"
              className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-800">
              Sub-Area Name <span className="text-rose-500">*</span>
            </label>
            <p className="mb-2 text-xs text-slate-500">Name of the sub-area.</p>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="New Baneshwor"
              className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
            />
          </div>
        </div>

        {/* Short Name / Status */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-slate-800">
              Short Name <span className="text-rose-500">*</span>
            </label>
            <p className="mb-2 text-xs text-slate-500">Abbreviation used on compact views/reports.</p>
            <input
              value={shortName}
              onChange={(e) => setShortName(e.target.value)}
              placeholder="NBW"
              className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-800">Status</label>
            <p className="mb-2 text-xs text-slate-500">Set active to make this sub-area available.</p>
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
          onClick={() =>
            router.push(isEdit ? `/master/areas/sub-areas/${initial!.id}` : "/master/areas/sub-areas")
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
          {submitting ? "Saving..." : isEdit ? "Update Sub-Area" : "Save Sub-Area"}
        </button>
      </div>
    </form>
  );
}
