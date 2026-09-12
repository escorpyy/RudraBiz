import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import StatusBadge from "@/components/account-groups/StatusBadge";
import DetailActions from "@/components/shared/DetailActions";

export const dynamic = "force-dynamic";

export default async function ViewStockCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const category = await prisma.stockCategory.findUnique({
    where: { id: Number(id) },
    include: { _count: { select: { stockDetails: true } } },
  });
  if (!category) notFound();

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">{category.name}</h1>
            <StatusBadge status={category.isActive ? "ACTIVE" : "INACTIVE"} />
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-sm">
            <Link href="/master/stock-categories" className="text-brand hover:underline">
              Stock Category Master
            </Link>
            <span className="text-slate-400">&gt;</span>
            <span className="text-slate-500">{category.code}</span>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            href="/master/stock-categories"
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft size={16} />
            Back
          </Link>
          <DetailActions
            editHref={`/master/stock-categories/${category.id}/edit`}
            deleteUrl={`/api/stock-categories/${category.id}`}
            redirectHref="/master/stock-categories"
            entityName={category.name}
          />
        </div>
      </div>

      <div className="my-5 border-t border-slate-200" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
          <div className="text-sm text-slate-500">Category Code</div>
          <div className="mt-1 text-lg font-semibold text-slate-900">{category.code}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
          <div className="text-sm text-slate-500">Stock Products Using This Category</div>
          <div className="mt-1 text-lg font-semibold text-slate-900">{category._count.stockDetails}</div>
        </div>
      </div>
    </div>
  );
}
