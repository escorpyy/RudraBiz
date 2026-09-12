import Link from "next/link";
import { Plus, Tags, CheckCircle2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import StatCard from "@/components/account-groups/StatCard";
import StockCategoriesTable, { type StockCategoryRow } from "@/components/stock-categories/StockCategoriesTable";

export const dynamic = "force-dynamic";

export default async function StockCategoriesPage() {
  const categories = await prisma.stockCategory.findMany({
    orderBy: { code: "asc" },
    include: { _count: { select: { stockDetails: true } } },
  });

  const rows: StockCategoryRow[] = categories.map((c) => ({
    id: c.id,
    code: c.code,
    name: c.name,
    productCount: c._count.stockDetails,
    status: c.isActive ? "ACTIVE" : "INACTIVE",
  }));

  const activeCount = rows.filter((r) => r.status === "ACTIVE").length;

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Stock Category Master</h1>
          <p className="mt-1 text-sm text-slate-500">Manage stock categories used to group Stock products</p>
        </div>
        <Link
          href="/master/stock-categories/new"
          className="flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-hover"
        >
          <Plus size={16} />
          New Category
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard icon={Tags} iconBg="bg-blue-100" iconColor="text-blue-600" label="Categories" value={rows.length} caption="Total stock categories" />
        <StatCard icon={CheckCircle2} iconBg="bg-emerald-100" iconColor="text-emerald-600" label="Active" value={activeCount} caption="Currently selectable" />
      </div>

      <div className="mt-6">
        <StockCategoriesTable rows={rows} />
      </div>
    </div>
  );
}
