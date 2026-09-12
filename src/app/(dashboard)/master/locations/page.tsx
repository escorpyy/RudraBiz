import Link from "next/link";
import { Plus, MapPinned, CheckCircle2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import StatCard from "@/components/account-groups/StatCard";
import LocationsTable, { type LocationRow } from "@/components/locations/LocationsTable";

export const dynamic = "force-dynamic";

export default async function LocationsPage() {
  const locations = await prisma.location.findMany({
    orderBy: { code: "asc" },
    include: { parent: { select: { name: true } }, _count: { select: { children: true } } },
  });

  const rows: LocationRow[] = locations.map((l) => ({
    id: l.id,
    code: l.code,
    name: l.name,
    parentName: l.parent?.name ?? null,
    childrenCount: l._count.children,
    status: l.isActive ? "ACTIVE" : "INACTIVE",
  }));

  const activeCount = rows.filter((r) => r.status === "ACTIVE").length;
  const topLevelCount = rows.filter((r) => !r.parentName).length;

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Location Master</h1>
          <p className="mt-1 text-sm text-slate-500">Manage warehouses/locations used across Products</p>
        </div>
        <Link
          href="/master/locations/new"
          className="flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-hover"
        >
          <Plus size={16} />
          New Location
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={MapPinned} iconBg="bg-blue-100" iconColor="text-blue-600" label="Locations" value={rows.length} caption="Total locations" />
        <StatCard icon={CheckCircle2} iconBg="bg-emerald-100" iconColor="text-emerald-600" label="Active" value={activeCount} caption="Currently selectable" />
        <StatCard icon={MapPinned} iconBg="bg-amber-100" iconColor="text-amber-600" label="Top-Level" value={topLevelCount} caption="Without a parent location" />
      </div>

      <div className="mt-6">
        <LocationsTable rows={rows} />
      </div>
    </div>
  );
}
