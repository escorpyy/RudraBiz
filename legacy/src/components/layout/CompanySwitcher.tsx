"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Building2, ChevronDown, MapPin, CalendarRange } from "lucide-react";

type Company = { id: number; name: string; code: string };
type Branch = { id: number; name: string; code: string };
type FiscalYear = { id: number; code: string; isCurrent: boolean };

type ContextPayload = {
  companies: Company[];
  branches: Branch[];
  fiscalYears: FiscalYear[];
  selected: { companyId: number | null; branchId: number | null; fiscalYearId: number | null };
};

function Dropdown({
  icon,
  value,
  onChange,
  options,
  placeholder,
  disabled,
}: {
  icon: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
  disabled?: boolean;
}) {
  return (
    <div className="relative flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 shadow-card">
      <span className="text-slate-400">{icon}</span>
      <select
        className="appearance-none bg-transparent pr-5 text-sm font-medium text-slate-700 outline-none disabled:text-slate-400"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.length === 0 && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown size={14} className="pointer-events-none absolute right-2.5 text-slate-400" />
    </div>
  );
}

export default function CompanySwitcher() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [data, setData] = useState<ContextPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/context")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  async function switchContext(body: Record<string, unknown>) {
    setLoading(true);
    const res = await fetch("/api/context", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const next: ContextPayload = await res.json();
    setData(next);
    setLoading(false);
    startTransition(() => router.refresh());
  }

  if (!data && loading) {
    return (
      <div className="flex items-center gap-3 px-6 py-3">
        <div className="h-8 w-40 animate-pulse rounded-lg bg-slate-100" />
        <div className="h-8 w-32 animate-pulse rounded-lg bg-slate-100" />
        <div className="h-8 w-28 animate-pulse rounded-lg bg-slate-100" />
      </div>
    );
  }

  if (!data || data.companies.length === 0) {
    return (
      <div className="flex items-center gap-2 px-6 py-3 text-sm text-slate-500">
        <Building2 size={16} />
        No company set up yet.
      </div>
    );
  }

  const { companies, branches, fiscalYears, selected } = data;
  const branchOptions = [{ value: "", label: "All Branches" }, ...branches.map((b) => ({ value: String(b.id), label: b.name }))];

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-white px-6 py-3">
      <Dropdown
        icon={<Building2 size={15} />}
        value={selected.companyId ? String(selected.companyId) : ""}
        disabled={isPending}
        placeholder="Select company"
        options={companies.map((c) => ({ value: String(c.id), label: c.name }))}
        onChange={(v) => switchContext({ companyId: Number(v) })}
      />
      <Dropdown
        icon={<MapPin size={15} />}
        value={selected.branchId ? String(selected.branchId) : ""}
        disabled={isPending}
        placeholder="All Branches"
        options={branchOptions}
        onChange={(v) => switchContext({ branchId: v === "" ? null : Number(v) })}
      />
      <Dropdown
        icon={<CalendarRange size={15} />}
        value={selected.fiscalYearId ? String(selected.fiscalYearId) : ""}
        disabled={isPending}
        placeholder="No fiscal year"
        options={fiscalYears.map((fy) => ({ value: String(fy.id), label: fy.isCurrent ? `${fy.code} (Current)` : fy.code }))}
        onChange={(v) => switchContext({ fiscalYearId: v === "" ? null : Number(v) })}
      />
    </div>
  );
}
