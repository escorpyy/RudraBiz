import Link from "next/link";
import { Plus, Layers, CheckCircle2, Boxes } from "lucide-react";
import { prisma } from "@/lib/prisma";
import StatCard from "@/components/account-groups/StatCard";
import ProductGroupsTable, { type ProductGroupRow } from "@/components/product-groups/ProductGroupsTable";

export const dynamic = "force-dynamic";

export default async function ProductGroupsPage() {
  const groups = await prisma.productGroup.findMany({
    orderBy: { code: "asc" },
    include: { subGroups: { include: { _count: { select: { products: true } } } } },
  });

  const rows: ProductGroupRow[] = groups.map((g) => ({
    id: g.id,
    code: g.code,
    name: g.name,
    subGroupsCount: g.subGroups.length,
    productsCount: g.subGroups.reduce((sum, sg) => sum + sg._count.products, 0),
    status: g.isActive ? "ACTIVE" : "INACTIVE",
  }));

  const activeCount = rows.filter((r) => r.status === "ACTIVE").length;
  const totalProducts = rows.reduce((sum, r) => sum + r.productsCount, 0);

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Product Group Master</h1>
          <p className="mt-1 text-sm text-slate-500">Manage top-level product groups</p>
        </div>
        <Link
          href="/master/product-groups/new"
          className="flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-hover"
        >
          <Plus size={16} />
          New Group
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={Layers} iconBg="bg-blue-100" iconColor="text-blue-600" label="Groups" value={rows.length} caption="Total product groups" />
        <StatCard icon={CheckCircle2} iconBg="bg-emerald-100" iconColor="text-emerald-600" label="Active" value={activeCount} caption="Currently selectable" />
        <StatCard icon={Boxes} iconBg="bg-amber-100" iconColor="text-amber-600" label="Products" value={totalProducts} caption="Across all groups" />
      </div>

      <div className="mt-6">
        <ProductGroupsTable rows={rows} />
      </div>
    </div>
  );
}
