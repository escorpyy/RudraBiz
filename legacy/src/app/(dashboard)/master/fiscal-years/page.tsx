import Link from "next/link";
import { Plus, CalendarRange, CheckCircle2, Lock, Star } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCompanyContext } from "@/lib/companyContext";
import StatCard from "@/components/account-groups/StatCard";
import FiscalYearsTable, { type FiscalYearRow } from "@/components/fiscal-years/FiscalYearsTable";

export const dynamic = "force-dynamic";

export default async function FiscalYearsPage() {
  const { companyId } = await getCompanyContext();
  const fiscalYears = companyId
    ? await prisma.fiscalYear.findMany({
        where: { companyId },
        orderBy: { startDate: "desc" },
        include: { _count: { select: { openingBalances: true, stockOpeningBalances: true } } },
      })
    : [];

  const rows: FiscalYearRow[] = fiscalYears.map((fy) => ({
    id: fy.id,
    code: fy.code,
    startDate: fy.startDate.toISOString(),
    endDate: fy.endDate.toISOString(),
    isCurrent: fy.isCurrent,
    isClosed: fy.isClosed,
    isOpeningBalanceLocked: fy.isOpeningBalanceLocked,
    inUseCount: fy._count.openingBalances + fy._count.stockOpeningBalances,
    status: fy.isActive ? "ACTIVE" : "INACTIVE",
  }));

  const activeCount = rows.filter((r) => r.status === "ACTIVE").length;
  const current = rows.find((r) => r.isCurrent);
  const lockedCount = rows.filter((r) => r.isOpeningBalanceLocked).length;

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Fiscal Year Master</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage fiscal years used for opening balances, vouchers, and the header switcher
          </p>
        </div>
        <Link
          href="/master/fiscal-years/new"
          className="flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-hover"
        >
          <Plus size={16} />
          New Fiscal Year
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-4">
        <StatCard icon={CalendarRange} iconBg="bg-blue-100" iconColor="text-blue-600" label="Fiscal Years" value={rows.length} caption="Total fiscal years" />
        <StatCard icon={CheckCircle2} iconBg="bg-emerald-100" iconColor="text-emerald-600" label="Active" value={activeCount} caption="Currently selectable" />
        <StatCard
          icon={Star}
          iconBg="bg-violet-100"
          iconColor="text-violet-600"
          label="Current Year"
          value={current ? 1 : 0}
          caption={current ? current.code : "None set"}
        />
        <StatCard icon={Lock} iconBg="bg-amber-100" iconColor="text-amber-600" label="Locked" value={lockedCount} caption="Opening balances locked" />
      </div>

      <div className="mt-6">
        <FiscalYearsTable rows={rows} />
      </div>
    </div>
  );
}
