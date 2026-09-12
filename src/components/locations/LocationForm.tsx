"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ChevronDown, MapPinned, Save } from "lucide-react";
import Combobox, { type ComboboxOption } from "@/components/shared/Combobox";
import type { RecordStatus } from "@/lib/constants";

type LocationOption = { id: number; code: string; name: string; parentName: string | null };

export type LocationFormInitial = {
  id: number;
  code: string;
  name: string;
  parentId: number | null;
  status: RecordStatus;
};

export default function LocationForm({ initial }: { initial?: LocationFormInitial }) {
  const router = useRouter();
  const isEdit = Boolean(initial);
  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [code, setCode] = useState(initial?.code ?? "");
  const [name, setName] = useState(initial?.name ?? "");
  const [parentId, setParentId] = useState(initial?.parentId ? String(initial.parentId) : "");
  const [status, setStatus] = useState<RecordStatus>(initial?.status ?? "ACTIVE");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/locations")
      .then((r) => r.json())
      .then(setLocations)
      .catch(() => setLocations([]));
  }, []);

  // A location can't be its own parent — filtered out on edit.
  const parentOptions: ComboboxOption[] = useMemo(
    () =>
      locations
        .filter((l) => l.id !== initial?.id)
        .map((l) => ({
          value: String(l.id),
          label: l.name,
          description: l.parentName ? `Under ${l.parentName}` : l.code,
        })),
    [locations, initial?.id]
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!code.trim() || !name.trim()) {
      setError("Location Code and Location Name are required.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(isEdit ? `/api/locations/${initial!.id}` : "/api/locations", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: code.trim(),
          name: name.trim(),
          parentId: parentId ? Number(parentId) : null,
          isActive: status === "ACTIVE",
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to save location.");
      }

      router.push(isEdit ? `/master/locations/${initial!.id}` : "/master/locations");
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
        <h2 className="text-base font-semibold text-slate-900">Location Information</h2>
        <p className="mt-1 text-sm text-slate-500">
          {isEdit ? "Update details of this location." : "Provide details of the new location."}
        </p>
      </div>
      <div className="my-5 border-t border-slate-200" />

      {error && (
        <div className="mb-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-slate-800">
              Location Code <span className="text-rose-500">*</span>
            </label>
            <p className="mb-2 text-xs text-slate-500">Unique code for this location.</p>
            <div className="relative">
              <MapPinned size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-500" />
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="WH-01"
                className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-3.5 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-800">
              Location Name <span className="text-rose-500">*</span>
            </label>
            <p className="mb-2 text-xs text-slate-500">Name of the warehouse/location.</p>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Main Warehouse"
              className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-slate-800">Parent Location</label>
            <p className="mb-2 text-xs text-slate-500">Optional — for a sub-location (e.g. a rack within a warehouse).</p>
            <Combobox
              options={parentOptions}
              value={parentId}
              onChange={setParentId}
              icon={MapPinned}
              placeholder="Search locations..."
              emptyMessage="No locations match your search."
              aria-label="Parent Location"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-800">Status</label>
            <p className="mb-2 text-xs text-slate-500">Set active to make this location selectable.</p>
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
          onClick={() => router.push(isEdit ? `/master/locations/${initial!.id}` : "/master/locations")}
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
          {submitting ? "Saving..." : isEdit ? "Update Location" : "Save Location"}
        </button>
      </div>
    </form>
  );
}
