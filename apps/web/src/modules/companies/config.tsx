import { Building2, CheckCircle2, GitBranch } from "lucide-react";
import { BUSINESS_TYPES, companyInputSchema, type CompanyDetail, type CompanyRow } from "@ntcas/shared";
import type { MasterConfig } from "../../components/master/types";
import StatusBadge from "../../components/shared/StatusBadge";

const BUSINESS_LABELS: Record<(typeof BUSINESS_TYPES)[number], string> = {
  SOLE_PROPRIETORSHIP: "Sole proprietorship",
  PARTNERSHIP: "Partnership",
  PRIVATE_LIMITED: "Private limited",
  PUBLIC_LIMITED: "Public limited",
  OTHER: "Other",
};

const text = (name: string, label: string, hint: string, extra: { placeholder?: string; required?: boolean; defaultValue?: string } = {}) =>
  ({ kind: "text", name, label, hint, ...extra }) as const;

/**
 * Company master: the tenant registry. You see the companies you have access to; only a
 * company-wide administrator can create (any company admin) or change/delete (that company's admin).
 */
export const companiesConfig: MasterConfig<CompanyRow, CompanyDetail> = {
  key: "companies",
  apiPath: "/api/companies",
  basePath: "/master/companies",
  singular: "Company",
  title: "Company Master",
  subtitle: "Manage the companies you administer; each has its own books",
  newLabel: "New Company",
  nameOf: (c) => c.name,
  codeOf: (c) => c.code,
  // role is per company, so the buttons follow it rather than the selected company's role
  canCreate: (rows) => rows.some((c) => c.role === "ADMIN"),
  canWriteRow: (c) => c.role === "ADMIN",
  alsoInvalidate: ["me"],

  stats: (rows) => [
    { icon: Building2, iconBg: "bg-blue-100", iconColor: "text-blue-600", label: "Companies", value: rows.length, caption: "Companies you can access" },
    { icon: CheckCircle2, iconBg: "bg-emerald-100", iconColor: "text-emerald-600", label: "Active", value: rows.filter((c) => c.isActive).length, caption: "Available in the switcher" },
  ],
  columns: [
    { header: "Code", cell: (c) => c.code, className: "font-medium text-slate-900" },
    { header: "Name", cell: (c) => c.name },
    { header: "Type", cell: (c) => BUSINESS_LABELS[c.businessType] },
    { header: "PAN", cell: (c) => c.panNo ?? "-" },
    { header: "Branches", cell: (c) => c.branchesCount },
    { header: "Your role", cell: (c) => <span className="text-slate-600">{c.role.charAt(0) + c.role.slice(1).toLowerCase()}</span> },
  ],
  searchText: (c) => [c.code, c.name, c.legalName ?? "", c.panNo ?? ""],
  deleteMessage:
    "This permanently deletes the company together with its branches and user access. A company that still has accounting records cannot be deleted; deactivate it instead. This can't be undone.",

  schema: companyInputSchema,
  fields: [
    { kind: "section", title: "Identity" },
    text("code", "Company Code", "Unique short code (up to 15 characters).", { placeholder: "NTCAS", required: true }),
    text("name", "Company Name", "Name shown in the company switcher.", { placeholder: "Nepal Trading Co.", required: true }),
    text("legalName", "Legal Name", "Registered name, if different."),
    {
      kind: "select", name: "businessType", label: "Business Type", hint: "How the business is organised.", required: true, defaultValue: "OTHER",
      options: BUSINESS_TYPES.map((t) => ({ value: t, label: BUSINESS_LABELS[t] })),
    },
    { kind: "section", title: "Registration and tax" },
    text("registrationNo", "Registration No.", "Company registration number."),
    text("panNo", "PAN No.", "Permanent account number."),
    { kind: "checkbox", name: "isVatRegistered", label: "VAT registered", hint: "Tick if the company is registered for VAT." },
    text("vatNo", "VAT No.", "Shown on VAT invoices."),
    text("taxOfficeName", "Tax Office", "Tax office the company files with."),
    { kind: "section", title: "Contact" },
    text("address", "Address", "Street address."),
    text("city", "City", "City or municipality."),
    text("district", "District", "District."),
    text("province", "Province", "Province."),
    text("country", "Country", "Country of operation.", { placeholder: "Nepal", defaultValue: "Nepal" }),
    text("phone", "Phone", "Main phone number."),
    text("email", "Email", "Main email address."),
    text("website", "Website", "Company website."),
    { kind: "section", title: "Books" },
    text("baseCurrency", "Base Currency", "3-letter currency code.", { placeholder: "NPR", required: true, defaultValue: "NPR" }),
    {
      kind: "select", name: "defaultCalendarPref", label: "Default Calendar", hint: "Calendar used for dates by default.", required: true, defaultValue: "BS",
      options: [{ value: "BS", label: "BS (Bikram Sambat)" }, { value: "AD", label: "AD (Gregorian)" }],
    },
    { kind: "status", label: "Status", hint: "Inactive companies disappear from the company switcher." },
  ],

  summary: [
    { label: "Company Code", value: (c) => c.code },
    { label: "Business Type", value: (c) => BUSINESS_LABELS[c.businessType] },
    { label: "PAN / VAT", value: (c) => [c.panNo, c.isVatRegistered ? (c.vatNo ?? "VAT registered") : null].filter(Boolean).join(" / ") || "-" },
    { label: "Currency", value: (c) => `${c.baseCurrency} / ${c.defaultCalendarPref}` },
  ],
  detailExtra: (c) => (
    <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900"><GitBranch size={16} className="text-blue-500" /> Branches</h2>
        </div>
        <ul className="mt-3 divide-y divide-slate-100 text-sm">
          {c.branches.map((b) => (
            <li key={b.id} className="flex items-center justify-between py-2">
              <span><span className="font-medium text-slate-900">{b.code}</span> <span className="text-slate-600">{b.name}</span>{b.isHeadOffice && <span className="ml-2 rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700">Head office</span>}</span>
              <StatusBadge status={b.isActive ? "ACTIVE" : "INACTIVE"} />
            </li>
          ))}
        </ul>
      </section>
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
        <h2 className="text-base font-semibold text-slate-900">Fiscal years</h2>
        {c.fiscalYears.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No fiscal years yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-100 text-sm">
            {c.fiscalYears.map((f) => (
              <li key={f.id} className="flex items-center justify-between py-2">
                <span className="font-medium text-slate-900">{f.code}</span>
                <span className="text-slate-500">{f.isCurrent ? "Current" : f.isClosed ? "Closed" : "Open"}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  ),
};
