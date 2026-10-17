import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Star, Lock } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCompanyContext } from "@/lib/companyContext";
import StatusBadge from "@/components/account-groups/StatusBadge";
import DetailActions from "@/components/shared/DetailActions";

export const dynamic = "force-dynamic";

export default async function ViewFiscalYearPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { companyId } = await getCompanyContext();
  if (!companyId) notFound();
  const fiscalYear = await prisma.fiscalYear.findFirst({
    where: { id: Number(id), companyId },
    include: { _count: { select: { openingBalances: true, stockOpeningBalances: true } } },
  });
  if (!fiscalYear) notFound();

  const inUseCount = fiscalYear._count.openingBalances + fiscalYear._count.stockOpeningBalances;

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">{fiscalYear.code}</h1>
            <StatusBadge status={fiscalYear.isActive ? "ACTIVE" : "INACTIVE"} />
            {fiscalYear.isCurrent && (
              <span className="inline-flex items-center gap-1.5 rounded-md bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                <Star size={12} className="fill-blue-700" />
                Current
              </span>
            )}
            {fiscalYear.isClosed && (
              <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                Closed
              </span>
            )}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-sm">
            <Link href="/master/fiscal-years" className="text-brand hover:underline">
              Fiscal Year Master
            </Link>
            <span className="text-slate-400">&gt;</span>
            <span className="text-slate-500">{fiscalYear.code}</span>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            href="/master/fiscal-years"
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft size={16} />
            Back
          </Link>
          <DetailActions
            editHref={`/master/fiscal-years/${fiscalYear.id}/edit`}
            deleteUrl={`/api/fiscal-years/${fiscalYear.id}`}
            redirectHref="/master/fiscal-years"
            entityName={fiscalYear.code}
          />
        </div>
      </div>

      <div className="my-5 border-t border-slate-200" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
          <div className="text-sm text-slate-500">Start Date</div>
          <div className="mt-1 text-lg font-semibold text-slate-900">
            {fiscalYear.startDate.toLocaleDateString()}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
          <div className="text-sm text-slate-500">End Date</div>
          <div className="mt-1 text-lg font-semibold text-slate-900">
            {fiscalYear.endDate.toLocaleDateString()}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
          <div className="text-sm text-slate-500">Opening Balance Rows</div>
          <div className="mt-1 text-lg font-semibold text-slate-900">{inUseCount}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
          <div className="text-sm text-slate-500">Opening Balances</div>
          <div className="mt-1 flex items-center gap-1.5 text-lg font-semibold text-slate-900">
            {fiscalYear.isOpeningBalanceLocked ? (
              <>
                <Lock size={16} className="text-amber-600" />
                Locked
              </>
            ) : (
              "Open"
            )}
          </div>
        </div>
      </div>

      {(fiscalYear.isClosed || fiscalYear.isOpeningBalanceLocked) && (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {fiscalYear.isClosed && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
              <div className="text-sm text-slate-500">Closed At</div>
              <div className="mt-1 text-sm font-medium text-slate-900">
                {fiscalYear.closedAt ? fiscalYear.closedAt.toLocaleString() : "—"}
              </div>
            </div>
          )}
          {fiscalYear.isOpeningBalanceLocked && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
              <div className="text-sm text-slate-500">Locked At</div>
              <div className="mt-1 text-sm font-medium text-slate-900">
                {fiscalYear.openingBalanceLockedAt ? fiscalYear.openingBalanceLockedAt.toLocaleString() : "—"}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
