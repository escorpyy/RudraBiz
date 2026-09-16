"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronDown, Building2, MapPin, Save } from "lucide-react";
import type { ComboboxOption } from "@/components/shared/Combobox";
import Combobox from "@/components/shared/Combobox";
import type { RecordStatus } from "@/lib/constants";

type CompanyOption = { id: number; code: string; name: string; isActive: boolean };

export type BranchFormInitial = {
  id: number;
  companyId: number;
  code: string;
  name: string;
  isHeadOffice: boolean;
  address: string;
  phone: string;
  email: string;
  status: RecordStatus;
};

export default function BranchForm({ initial }: { initial?: BranchFormInitial }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEdit = Boolean(initial);

  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [companyId, setCompanyId] = useState(
    initial ? String(initial.companyId) : searchParams.get("companyId") ?? ""
  );
  const [code, setCode] = useState(initial?.code ?? "");
  const [name, setName] = useState(initial?.name ?? "");
  const [isHeadOffice, setIsHeadOffice] = useState(initial?.isHeadOffice ?? false);
  const [address, setAddress] = useState(initial?.address ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [status, setStatus] = useState<RecordStatus>(initial?.status ?? "ACTIVE");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/companies")
      .then((r) => r.json())
      .then((rows: CompanyOption[]) => setCompanies(Array.isArray(rows) ? rows.filter((c) => c.isActive) : []))
      .catch(() => setCompanies([]));
  }, []);

  const companyOptions: ComboboxOption[] = companies.map((c) => ({
    value: String(c.id),
    label: c.name,
    description: c.code,
  }));

  // The company a branch belongs to is fixed once it exists — this page is
  // always reached from a specific company's "New Branch" link or from
  // editing an existing branch, so re-parenting isn't offered here (the API
  // doesn't accept a companyId change on PATCH either).
  const companyLocked = isEdit;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!companyId) {
      setError("Company is required.");
      return;
    }
    if (!code.trim() || !name.trim()) {
      setError("Branch Code and Branch Name are required.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(isEdit ? `/api/branches/${initial!.id}` : "/api/branches", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId: Number(companyId),
          code: code.trim(),
          name: name.trim(),
          isHeadOffice,
          address: address.trim(),
          phone: phone.trim(),
          email: email.trim(),
          isActive: status === "ACTIVE",
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to save branch.");
      }

      const saved = await res.json();
      router.push(isEdit ? `/setup/company/branches/${initial!.id}` : `/setup/company/branches/${saved.id}`);
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
        <h2 className="text-base font-semibold text-slate-900">Branch Information</h2>
        <p className="mt-1 text-sm text-slate-500">
          {isEdit ? "Update details of this branch." : "Provide details of the new branch."}
        </p>
      </div>
      <div className="my-5 border-t border-slate-200" />

      {error && (
        <div className="mb-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="space-y-5">
        {/* Company */}
        <div>
          <label className="text-sm font-medium text-slate-800">
            Company <span className="text-rose-500">*</span>
          </label>
          <p className="mb-2 text-xs text-slate-500">
            {companyLocked ? "The company this branch belongs to." : "Which company this branch belongs to."}
          </p>
          <Combobox
            options={companyOptions}
            value={companyId}
            onChange={setCompanyId}
            icon={Building2}
            disabled={companyLocked}
            placeholder="Search companies..."
            emptyMessage="No companies available"
          />
        </div>

        {/* Code / Name */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-slate-800">
              Branch Code <span className="text-rose-500">*</span>
            </label>
            <p className="mb-2 text-xs text-slate-500">Unique within this company.</p>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="PKR"
              className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-800">
              Branch Name <span className="text-rose-500">*</span>
            </label>
            <p className="mb-2 text-xs text-slate-500">Shown in the header switcher.</p>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Pokhara Branch"
              className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
            />
          </div>
        </div>

        {/* Head office flag */}
        <div>
          <label className="flex items-center gap-2.5 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={isHeadOffice}
              onChange={(e) => setIsHeadOffice(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand"
            />
            Head office
          </label>
          <p className="mt-1.5 text-xs text-slate-500">
            Only one branch per company can be the head office — setting this clears it from any other branch.
          </p>
        </div>

        <div className="border-t border-slate-200" />

        {/* Contact */}
        <div>
          <div className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-slate-900">
            <MapPin size={15} className="text-blue-500" />
            Contact
          </div>
          <div className="space-y-5">
            <div>
              <label className="text-sm font-medium text-slate-800">Address</label>
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Lakeside, Pokhara"
                className="mt-2 w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
              />
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-800">Phone</label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-800">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="text-sm font-medium text-slate-800">Status</label>
          <p className="mb-2 text-xs text-slate-500">Set active to make this branch selectable in the switcher.</p>
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
          onClick={() =>
            router.push(
              isEdit
                ? `/setup/company/branches/${initial!.id}`
                : companyId
                  ? `/setup/company/${companyId}`
                  : "/setup/company"
            )
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
          {submitting ? "Saving..." : isEdit ? "Update Branch" : "Save Branch"}
        </button>
      </div>
    </form>
  );
}
