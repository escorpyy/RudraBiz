import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import StatusBadge from "@/components/account-groups/StatusBadge";
import DetailActions from "@/components/shared/DetailActions";

export const dynamic = "force-dynamic";

export default async function ViewTaxRatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const taxRate = await prisma.taxRate.findUnique({
    where: { id: Number(id) },
    include: { _count: { select: { stockDetails: true, nonStockDetails: true, serviceDetails: true } } },
  });
  if (!taxRate) notFound();

  const inUseCount = taxRate._count.stockDetails + taxRate._count.nonStockDetails + taxRate._count.serviceDetails;

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">{taxRate.name}</h1>
            <StatusBadge status={taxRate.isActive ? "ACTIVE" : "INACTIVE"} />
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-sm">
            <Link href="/master/tax-rates" className="text-brand hover:underline">
              Tax Rate Master
            </Link>
            <span className="text-slate-400">&gt;</span>
            <span className="text-slate-500">{taxRate.code}</span>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            href="/master/tax-rates"
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft size={16} />
            Back
          </Link>
          <DetailActions
            editHref={`/master/tax-rates/${taxRate.id}/edit`}
            deleteUrl={`/api/tax-rates/${taxRate.id}`}
            redirectHref="/master/tax-rates"
            entityName={taxRate.name}
          />
        </div>
      </div>

      <div className="my-5 border-t border-slate-200" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
          <div className="text-sm text-slate-500">Code</div>
          <div className="mt-1 text-lg font-semibold text-slate-900">{taxRate.code}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
          <div className="text-sm text-slate-500">Rate %</div>
          <div className="mt-1 text-lg font-semibold text-slate-900">{String(taxRate.ratePercent)}%</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
          <div className="text-sm text-slate-500">HSN / SAC</div>
          <div className="mt-1 text-lg font-semibold text-slate-900">{taxRate.hsnSacCode || "—"}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
          <div className="text-sm text-slate-500">Products Using This Rate</div>
          <div className="mt-1 text-lg font-semibold text-slate-900">{inUseCount}</div>
        </div>
      </div>
    </div>
  );
}
