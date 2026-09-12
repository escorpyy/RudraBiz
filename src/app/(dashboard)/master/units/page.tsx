import Link from "next/link";
import { Plus, Ruler, CheckCircle2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import StatCard from "@/components/account-groups/StatCard";
import UnitsTable, { type UnitRow } from "@/components/units/UnitsTable";

export const dynamic = "force-dynamic";

export default async function UnitsPage() {
  const units = await prisma.productUnit.findMany({
    orderBy: { code: "asc" },
    include: {
      _count: { select: { stockBaseFor: true, nonStockUnitFor: true, serviceUnitFor: true, alternateUnitFor: true } },
    },
  });

  const rows: UnitRow[] = units.map((u) => ({
    id: u.id,
    code: u.code,
    name: u.name,
    decimalPlaces: u.decimalPlaces,
    inUseCount: u._count.stockBaseFor + u._count.nonStockUnitFor + u._count.serviceUnitFor + u._count.alternateUnitFor,
    status: u.isActive ? "ACTIVE" : "INACTIVE",
  }));

  const activeCount = rows.filter((r) => r.status === "ACTIVE").length;

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Unit Master</h1>
          <p className="mt-1 text-sm text-slate-500">Manage units of measure used across Products</p>
        </div>
        <Link
          href="/master/units/new"
          className="flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-hover"
        >
          <Plus size={16} />
          New Unit
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard icon={Ruler} iconBg="bg-blue-100" iconColor="text-blue-600" label="Units" value={rows.length} caption="Total units" />
        <StatCard icon={CheckCircle2} iconBg="bg-emerald-100" iconColor="text-emerald-600" label="Active" value={activeCount} caption="Currently selectable" />
      </div>

      <div className="mt-6">
        <UnitsTable rows={rows} />
      </div>
    </div>
  );
}
