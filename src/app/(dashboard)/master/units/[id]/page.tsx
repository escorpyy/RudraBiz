import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import StatusBadge from "@/components/account-groups/StatusBadge";
import DetailActions from "@/components/shared/DetailActions";

export const dynamic = "force-dynamic";

export default async function ViewUnitPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const unit = await prisma.productUnit.findUnique({
    where: { id: Number(id) },
    include: {
      _count: { select: { stockBaseFor: true, nonStockUnitFor: true, serviceUnitFor: true, alternateUnitFor: true } },
    },
  });
  if (!unit) notFound();

  const inUseCount =
    unit._count.stockBaseFor + unit._count.nonStockUnitFor + unit._count.serviceUnitFor + unit._count.alternateUnitFor;

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">{unit.name}</h1>
            <StatusBadge status={unit.isActive ? "ACTIVE" : "INACTIVE"} />
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-sm">
            <Link href="/master/units" className="text-brand hover:underline">
              Unit Master
            </Link>
            <span className="text-slate-400">&gt;</span>
            <span className="text-slate-500">{unit.code}</span>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            href="/master/units"
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft size={16} />
            Back
          </Link>
          <DetailActions
            editHref={`/master/units/${unit.id}/edit`}
            deleteUrl={`/api/product-units/${unit.id}`}
            redirectHref="/master/units"
            entityName={unit.name}
          />
        </div>
      </div>

      <div className="my-5 border-t border-slate-200" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
          <div className="text-sm text-slate-500">Unit Code</div>
          <div className="mt-1 text-lg font-semibold text-slate-900">{unit.code}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
          <div className="text-sm text-slate-500">Decimal Places</div>
          <div className="mt-1 text-lg font-semibold text-slate-900">{unit.decimalPlaces}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
          <div className="text-sm text-slate-500">In Use On</div>
          <div className="mt-1 text-lg font-semibold text-slate-900">{inUseCount} record(s)</div>
        </div>
      </div>
    </div>
  );
}
