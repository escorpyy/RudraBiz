import Link from "next/link";
import { Plus, MapPin, MapPinned, BookOpen } from "lucide-react";
import { prisma } from "@/lib/prisma";
import StatCard from "@/components/account-groups/StatCard";
import AreasTable, { type AreaRow } from "@/components/areas/AreasTable";

export const dynamic = "force-dynamic";

export default async function AreasPage() {
  const areas = await prisma.area.findMany({
    orderBy: { code: "asc" },
    include: {
      subAreas: {
        include: { _count: { select: { generalLedgers: true, parties: true } } },
      },
    },
  });

  const rows: AreaRow[] = areas.map((a) => ({
    id: a.id,
    code: a.code,
    name: a.name,
    shortName: a.shortName,
    subAreasCount: a.subAreas.length,
    ledgersCount: a.subAreas.reduce((sum, sa) => sum + sa._count.generalLedgers, 0),
    partiesCount: a.subAreas.reduce((sum, sa) => sum + sa._count.parties, 0),
    status: a.isActive ? "ACTIVE" : "INACTIVE",
  }));

  const totalSubAreas = rows.reduce((sum, r) => sum + r.subAreasCount, 0);
  const totalLedgers = rows.reduce((sum, r) => sum + r.ledgersCount, 0);

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Area Master</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage areas and sub-areas used to tag ledgers and parties
          </p>
        </div>
        <Link
          href="/master/areas/new"
          className="flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-hover"
        >
          <Plus size={16} />
          New Area
        </Link>
      </div>

      {/* Stat cards */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          icon={MapPin}
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
          label="Areas"
          value={rows.length}
          caption="Total areas"
        />
        <StatCard
          icon={MapPinned}
          iconBg="bg-emerald-100"
          iconColor="text-emerald-600"
          label="Sub-Areas"
          value={totalSubAreas}
          caption="Total sub-areas"
        />
        <StatCard
          icon={BookOpen}
          iconBg="bg-amber-100"
          iconColor="text-amber-600"
          label="Ledgers"
          value={totalLedgers}
          caption="Ledgers tagged to a sub-area"
        />
      </div>

      <div className="mt-6">
        <AreasTable rows={rows} />
      </div>
    </div>
  );
}
