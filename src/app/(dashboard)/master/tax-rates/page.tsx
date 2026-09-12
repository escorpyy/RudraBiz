import Link from "next/link";
import { Plus, Percent, CheckCircle2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import StatCard from "@/components/account-groups/StatCard";
import TaxRatesTable, { type TaxRateRow } from "@/components/tax-rates/TaxRatesTable";

export const dynamic = "force-dynamic";

export default async function TaxRatesPage() {
  const taxRates = await prisma.taxRate.findMany({
    orderBy: { code: "asc" },
    include: { _count: { select: { stockDetails: true, nonStockDetails: true, serviceDetails: true } } },
  });

  const rows: TaxRateRow[] = taxRates.map((t) => ({
    id: t.id,
    code: t.code,
    name: t.name,
    ratePercent: String(t.ratePercent),
    hsnSacCode: t.hsnSacCode,
    inUseCount: t._count.stockDetails + t._count.nonStockDetails + t._count.serviceDetails,
    status: t.isActive ? "ACTIVE" : "INACTIVE",
  }));

  const activeCount = rows.filter((r) => r.status === "ACTIVE").length;

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tax Rate Master</h1>
          <p className="mt-1 text-sm text-slate-500">Manage tax rates used across Products</p>
        </div>
        <Link
          href="/master/tax-rates/new"
          className="flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-hover"
        >
          <Plus size={16} />
          New Tax Rate
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard icon={Percent} iconBg="bg-blue-100" iconColor="text-blue-600" label="Tax Rates" value={rows.length} caption="Total tax rates" />
        <StatCard icon={CheckCircle2} iconBg="bg-emerald-100" iconColor="text-emerald-600" label="Active" value={activeCount} caption="Currently selectable" />
      </div>

      <div className="mt-6">
        <TaxRatesTable rows={rows} />
      </div>
    </div>
  );
}
