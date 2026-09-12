import Link from "next/link";
import { Plus, Tags, CheckCircle2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import StatCard from "@/components/account-groups/StatCard";
import ProductSubGroupsTable, { type ProductSubGroupRow } from "@/components/product-groups/ProductSubGroupsTable";

export const dynamic = "force-dynamic";

export default async function ProductSubGroupsPage() {
  const subGroups = await prisma.productSubGroup.findMany({
    orderBy: { code: "asc" },
    include: { productGroup: true, _count: { select: { products: true } } },
  });

  const rows: ProductSubGroupRow[] = subGroups.map((sg) => ({
    id: sg.id,
    code: sg.code,
    name: sg.name,
    groupName: sg.productGroup.name,
    productsCount: sg._count.products,
    status: sg.isActive ? "ACTIVE" : "INACTIVE",
  }));

  const activeCount = rows.filter((r) => r.status === "ACTIVE").length;

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Product Sub-Group Master</h1>
          <p className="mt-1 text-sm text-slate-500">Manage sub-groups within each Product Group</p>
        </div>
        <Link
          href="/master/product-sub-groups/new"
          className="flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-hover"
        >
          <Plus size={16} />
          New Sub-Group
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard icon={Tags} iconBg="bg-blue-100" iconColor="text-blue-600" label="Sub-Groups" value={rows.length} caption="Total sub-groups" />
        <StatCard icon={CheckCircle2} iconBg="bg-emerald-100" iconColor="text-emerald-600" label="Active" value={activeCount} caption="Currently selectable" />
      </div>

      <div className="mt-6">
        <ProductSubGroupsTable rows={rows} />
      </div>
    </div>
  );
}
