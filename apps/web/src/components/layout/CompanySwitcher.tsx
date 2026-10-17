import { Building2, CalendarRange, ChevronDown, MapPin } from "lucide-react";
import { useEffect } from "react";
import { setSelection } from "../../lib/contextStore";
import { useChangeSelection, useMe, useSelection } from "../../lib/me";

function Dropdown({
  icon,
  value,
  onChange,
  options,
  placeholder,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
  label: string;
}) {
  return (
    <div className="relative flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 shadow-card">
      <span className="text-slate-400">{icon}</span>
      <select
        aria-label={label}
        className="appearance-none bg-transparent pr-5 text-sm font-medium text-slate-700 outline-none disabled:text-slate-400"
        value={value}
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
  const { data: me, isLoading } = useMe();
  const selection = useSelection();
  const change = useChangeSelection();

  // A saved choice that is no longer valid (access removed, company deactivated): fall back to server defaults.
  useEffect(() => {
    if (me?.contextError && Object.keys(selection).length > 0) setSelection({});
  }, [me?.contextError, selection]);

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 px-6 py-3">
        <div className="h-8 w-40 animate-pulse rounded-lg bg-slate-100" />
        <div className="h-8 w-32 animate-pulse rounded-lg bg-slate-100" />
        <div className="h-8 w-28 animate-pulse rounded-lg bg-slate-100" />
      </div>
    );
  }
  if (!me || me.companies.length === 0) {
    return (
      <div className="flex items-center gap-2 px-6 py-3 text-sm text-slate-500">
        <Building2 size={16} /> No company access yet.
      </div>
    );
  }

  const ctx = me.context;
  const company = me.companies.find((c) => c.id === (ctx?.companyId ?? selection.companyId)) ?? me.companies[0]!;
  const branchValue = selection.branchId === undefined ? (ctx?.branchId ? String(ctx.branchId) : "all") : String(selection.branchId);
  const branchOptions = [
    ...(company.allBranches ? [{ value: "all", label: "All Branches" }] : [{ value: "", label: "Select branch" }]),
    ...company.branches.map((b) => ({ value: String(b.id), label: b.name })),
  ];

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-white px-6 py-3">
      <Dropdown
        label="Company"
        icon={<Building2 size={15} />}
        value={String(company.id)}
        placeholder="Select company"
        options={me.companies.map((c) => ({ value: String(c.id), label: c.name }))}
        onChange={(v) => change({ companyId: Number(v) })}
      />
      <Dropdown
        label="Branch"
        icon={<MapPin size={15} />}
        value={branchValue}
        placeholder="All Branches"
        options={branchOptions}
        onChange={(v) => change({ ...selection, companyId: company.id, branchId: v === "" ? undefined : v === "all" ? "all" : Number(v) })}
      />
      <Dropdown
        label="Fiscal year"
        icon={<CalendarRange size={15} />}
        value={String(selection.fiscalYearId ?? ctx?.fiscalYearId ?? "")}
        placeholder="No fiscal year"
        options={company.fiscalYears.map((fy) => ({ value: String(fy.id), label: fy.isCurrent ? `${fy.code} (Current)` : fy.code }))}
        onChange={(v) => change({ ...selection, companyId: company.id, fiscalYearId: v === "" ? undefined : Number(v) })}
      />
      {me.contextError && <span className="text-xs text-amber-600">{me.contextError}</span>}
    </div>
  );
}
