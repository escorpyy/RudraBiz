import Link from "next/link";
import { Plus, Building2, MapPin, CheckCircle2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import StatCard from "@/components/account-groups/StatCard";
import CompaniesTable, { type CompanyRow } from "@/components/companies/CompaniesTable";

export const dynamic = "force-dynamic";

export default async function CompanyPage() {
  // Deliberately not scoped by the header switcher's selected company — see
  // src/app/api/companies/route.ts for why.
  const companies = await prisma.company.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { branches: true, fiscalYears: true } } },
  });

  const rows: CompanyRow[] = companies.map((c) => ({
    id: c.id,
    code: c.code,
    name: c.name,
    businessType: c.businessType,
    city: c.city,
    panNo: c.panNo,
    branchCount: c._count.branches,
    fiscalYearCount: c._count.fiscalYears,
    isActive: c.isActive,
  }));

  const activeCount = rows.filter((r) => r.isActive).length;
  const totalBranches = rows.reduce((sum, r) => sum + r.branchCount, 0);

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Company</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage the companies (tenants) available in the header switcher, and their branches.
          </p>
        </div>
        <Link
          href="/setup/company/new"
          className="flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-hover"
        >
          <Plus size={16} />
          New Company
        </Link>
      </div>

      <div className="my-5 border-t border-slate-200" />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <StatCard
          icon={Building2}
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
          label="Companies"
          value={rows.length}
          caption="Total companies"
        />
        <StatCard
          icon={CheckCircle2}
          iconBg="bg-emerald-100"
          iconColor="text-emerald-600"
          label="Active"
          value={activeCount}
          caption="Selectable in the switcher"
        />
        <StatCard
          icon={MapPin}
          iconBg="bg-violet-100"
          iconColor="text-violet-600"
          label="Branches"
          value={totalBranches}
          caption="Across all companies"
        />
      </div>

      <div className="mt-5">
        <CompaniesTable rows={rows} />
      </div>
    </div>
  );
}
