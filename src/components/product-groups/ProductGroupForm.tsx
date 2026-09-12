"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronDown, Layers, Save } from "lucide-react";
import type { RecordStatus } from "@/lib/constants";

export type ProductGroupFormInitial = {
  id: number;
  code: string;
  name: string;
  status: RecordStatus;
};

export default function ProductGroupForm({ initial }: { initial?: ProductGroupFormInitial }) {
  const router = useRouter();
  const isEdit = Boolean(initial);
  const [code, setCode] = useState(initial?.code ?? "");
  const [name, setName] = useState(initial?.name ?? "");
  const [status, setStatus] = useState<RecordStatus>(initial?.status ?? "ACTIVE");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!code.trim() || !name.trim()) {
      setError("Group Code and Group Name are required.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(isEdit ? `/api/product-groups/${initial!.id}` : "/api/product-groups", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim(), name: name.trim(), isActive: status === "ACTIVE" }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to save product group.");
      }

      router.push(isEdit ? `/master/product-groups/${initial!.id}` : "/master/product-groups");
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
        <h2 className="text-base font-semibold text-slate-900">Product Group Information</h2>
        <p className="mt-1 text-sm text-slate-500">
          {isEdit ? "Update details of this product group." : "Provide details of the new product group."}
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
              Group Code <span className="text-rose-500">*</span>
            </label>
            <p className="mb-2 text-xs text-slate-500">Unique code for this group.</p>
            <div className="relative">
              <Layers size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-500" />
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="PG-100"
                className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-3.5 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-800">
              Group Name <span className="text-rose-500">*</span>
            </label>
            <p className="mb-2 text-xs text-slate-500">Name of the product group.</p>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Building Materials"
              className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-slate-800">Status</label>
            <p className="mb-2 text-xs text-slate-500">Set active to make this group available.</p>
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
          onClick={() => router.push(isEdit ? `/master/product-groups/${initial!.id}` : "/master/product-groups")}
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
          {submitting ? "Saving..." : isEdit ? "Update Group" : "Save Group"}
        </button>
      </div>
    </form>
  );
}
