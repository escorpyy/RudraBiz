import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Plus, MapPin, Landmark, Phone, CalendarRange } from "lucide-react";
import { prisma } from "@/lib/prisma";
import StatusBadge from "@/components/account-groups/StatusBadge";
import DetailActions from "@/components/shared/DetailActions";
import { BUSINESS_TYPES, CALENDAR_PREFERENCES } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function ViewCompanyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const company = await prisma.company.findUnique({
    where: { id: Number(id) },
    include: {
      branches: {
        orderBy: [{ isHeadOffice: "desc" }, { name: "asc" }],
        include: { _count: { select: { openingBalances: true, journalVouchers: true, cashBankVouchers: true } } },
      },
      fiscalYears: { orderBy: { startDate: "desc" }, take: 1 },
    },
  });
  if (!company) notFound();

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">{company.name}</h1>
            <StatusBadge status={company.isActive ? "ACTIVE" : "INACTIVE"} />
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-sm">
            <Link href="/setup/company" className="text-brand hover:underline">
              Company
            </Link>
            <span className="text-slate-400">&gt;</span>
            <span className="text-slate-500">{company.code}</span>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            href="/setup/company"
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft size={16} />
            Back to List
          </Link>
          <DetailActions
            editHref={`/setup/company/${company.id}/edit`}
            deleteUrl={`/api/companies/${company.id}`}
            redirectHref="/setup/company"
            entityName={company.name}
          />
        </div>
      </div>

      <div className="my-5 border-t border-slate-200" />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Identity & Registration */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card">
          <h2 className="text-base font-semibold text-slate-900">Identity &amp; Registration</h2>
          <div className="my-4 border-t border-slate-200" />
          <dl className="space-y-4 text-sm">
            <div className="flex items-start gap-3">
              <Landmark size={16} className="mt-0.5 shrink-0 text-blue-600" />
              <div>
                <dt className="text-xs text-slate-500">Business Type</dt>
                <dd className="text-slate-800">
                  <span
                    className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${
                      BUSINESS_TYPES[company.businessType].badge
                    }`}
                  >
                    {BUSINESS_TYPES[company.businessType].label}
                  </span>
                </dd>
              </div>
            </div>
            {company.legalName && (
              <div>
                <dt className="text-xs text-slate-500">Legal Name</dt>
                <dd className="text-slate-800">{company.legalName}</dd>
              </div>
            )}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <dt className="text-xs text-slate-500">Registration No.</dt>
                <dd className="text-slate-800">{company.registrationNo ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">PAN No.</dt>
                <dd className="text-slate-800">{company.panNo ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">VAT No.</dt>
                <dd className="text-slate-800">{company.isVatRegistered ? company.vatNo ?? "—" : "Not registered"}</dd>
              </div>
            </div>
            {company.taxOfficeName && (
              <div>
                <dt className="text-xs text-slate-500">Tax Office</dt>
                <dd className="text-slate-800">{company.taxOfficeName}</dd>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-xs text-slate-500">Base Currency</dt>
                <dd className="text-slate-800">{company.baseCurrency}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Calendar</dt>
                <dd className="text-slate-800">{CALENDAR_PREFERENCES[company.defaultCalendarPref].label}</dd>
              </div>
            </div>
          </dl>
        </div>

        {/* Address & Contact */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card">
          <h2 className="text-base font-semibold text-slate-900">Address &amp; Contact</h2>
          <div className="my-4 border-t border-slate-200" />
          <dl className="space-y-4 text-sm">
            <div className="flex items-start gap-3">
              <MapPin size={16} className="mt-0.5 shrink-0 text-blue-600" />
              <div>
                <dt className="text-xs text-slate-500">Address</dt>
                <dd className="text-slate-800">
                  {[company.address, company.city, company.district, company.province, company.country]
                    .filter(Boolean)
                    .join(", ") || "—"}
                </dd>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone size={16} className="mt-0.5 shrink-0 text-blue-600" />
              <div>
                <dt className="text-xs text-slate-500">Phone / Email</dt>
                <dd className="text-slate-800">
                  {[company.phone, company.email].filter(Boolean).join(" · ") || "—"}
                </dd>
              </div>
            </div>
            {company.website && (
              <div>
                <dt className="text-xs text-slate-500">Website</dt>
                <dd className="text-slate-800">{company.website}</dd>
              </div>
            )}
            <div className="flex items-start gap-3">
              <CalendarRange size={16} className="mt-0.5 shrink-0 text-violet-600" />
              <div>
                <dt className="text-xs text-slate-500">Latest Fiscal Year</dt>
                <dd className="text-slate-800">{company.fiscalYears[0]?.code ?? "None set up yet"}</dd>
              </div>
            </div>
          </dl>
        </div>
      </div>

      {/* Nested branches, same convention as an Area's Sub-Areas list */}
      <div className="mt-5 rounded-xl border border-slate-200 bg-white shadow-card">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-blue-500" />
            <h2 className="text-base font-semibold text-slate-900">Branches</h2>
          </div>
          <Link
            href={`/setup/company/branches/new?companyId=${company.id}`}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <Plus size={15} />
            New Branch
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-medium uppercase tracking-wide text-slate-500">
                <th className="px-5 py-3 font-medium">Code</th>
                <th className="px-3 py-3 font-medium">Name</th>
                <th className="px-3 py-3 font-medium">Head Office</th>
                <th className="px-3 py-3 font-medium">In Use</th>
                <th className="px-3 py-3 font-medium">Status</th>
                <th className="px-5 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {company.branches.map((b) => {
                const inUse = b._count.openingBalances + b._count.journalVouchers + b._count.cashBankVouchers;
                return (
                  <tr key={b.id} className="hover:bg-slate-50/60">
                    <td className="px-5 py-3.5 font-medium text-slate-900">{b.code}</td>
                    <td className="px-3 py-3.5 text-slate-800">{b.name}</td>
                    <td className="px-3 py-3.5 text-slate-500">
                      {b.isHeadOffice ? (
                        <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                          Head Office
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-3 py-3.5 text-slate-500">{inUse}</td>
                    <td className="px-3 py-3.5">
                      <StatusBadge status={b.isActive ? "ACTIVE" : "INACTIVE"} />
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        href={`/setup/company/branches/${b.id}`}
                        className="text-sm font-medium text-brand hover:underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {company.branches.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-sm text-slate-400">
                    No branches in this company yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
