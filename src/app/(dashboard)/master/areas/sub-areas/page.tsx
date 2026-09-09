import Link from "next/link";
import { Plus, MapPinned } from "lucide-react";
import { prisma } from "@/lib/prisma";
import StatCard from "@/components/account-groups/StatCard";
import SubAreasTable, { type SubAreaRow } from "@/components/areas/SubAreasTable";

export const dynamic = "force-dynamic";

export default async function SubAreasPage() {
  const subAreas = await prisma.subArea.findMany({
    orderBy: { code: "asc" },
    include: {
      area: true,
      _count: { select: { generalLedgers: true, parties: true } },
    },
  });

  const rows: SubAreaRow[] = subAreas.map((sa) => ({
    id: sa.id,
    code: sa.code,
    name: sa.name,
    shortName: sa.shortName,
    areaId: sa.areaId,
    areaName: sa.area.name,
    ledgersCount: sa._count.generalLedgers,
    partiesCount: sa._count.parties,
    status: sa.isActive ? "ACTIVE" : "INACTIVE",
  }));

  const areaOptions = Array.from(
    new Map(rows.map((r) => [r.areaId, { id: r.areaId, name: r.areaName }])).values()
  );

  const activeCount = rows.filter((r) => r.status === "ACTIVE").length;
  const totalLedgers = rows.reduce((sum, r) => sum + r.ledgersCount, 0);

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Sub-Area Master</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage sub-areas — the level ledgers and parties actually tag against
          </p>
        </div>
        <Link
          href="/master/areas/sub-areas/new"
          className="flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-hover"
        >
          <Plus size={16} />
          New Sub-Area
        </Link>
      </div>

      {/* Stat cards */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          icon={MapPinned}
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
          label="Sub-Areas"
          value={rows.length}
          caption="Total sub-areas"
        />
        <StatCard
          icon={MapPinned}
          iconBg="bg-emerald-100"
          iconColor="text-emerald-600"
          label="Active"
          value={activeCount}
          caption="Available for use"
        />
        <StatCard
          icon={MapPinned}
          iconBg="bg-amber-100"
          iconColor="text-amber-600"
          label="Ledgers"
          value={totalLedgers}
          caption="Total ledgers across all sub-areas"
        />
      </div>

      <div className="mt-6">
        <SubAreasTable rows={rows} areaOptions={areaOptions} />
      </div>
    </div>
  );
}
