import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BookOpen, Layers, MapPin, CalendarRange, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCompanyContext } from "@/lib/companyContext";
import DetailActions from "@/components/shared/DetailActions";

export const dynamic = "force-dynamic";

function money(value: number) {
  return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default async function ViewOpeningBalancePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { companyId } = await getCompanyContext();
  if (!companyId) notFound();

  const row = await prisma.openingBalance.findFirst({
    where: { id: Number(id), companyId },
    include: {
      generalLedger: { select: { id: true, code: true, name: true } },
      subLedger: { select: { id: true, code: true, name: true } },
      branch: { select: { name: true } },
      fiscalYear: { select: { code: true } },
      carriedForwardFrom: { select: { id: true, fiscalYear: { select: { code: true } } } },
      _count: { select: { carriedForwardTo: true } },
    },
  });
  if (!row) notFound();

  const debit = Number(row.debit);
  const credit = Number(row.credit);

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">{row.generalLedger.name}</h1>
            <span
              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium ${
                debit > 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
              }`}
            >
              {debit > 0 ? <ArrowDownLeft size={13} /> : <ArrowUpRight size={13} />}
              {debit > 0 ? "Debit" : "Credit"}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-sm">
            <Link href="/master/opening-balance" className="text-brand hover:underline">
              Opening Balance Master
            </Link>
            <span className="text-slate-400">&gt;</span>
            <span className="text-slate-500">{row.generalLedger.code}</span>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            href="/master/opening-balance"
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft size={16} />
            Back to List
          </Link>
          <DetailActions
            editHref={`/master/opening-balance/${row.id}/edit`}
            deleteUrl={`/api/opening-balances/${row.id}`}
            redirectHref="/master/opening-balance"
            entityName={`Opening balance for ${row.generalLedger.name}`}
          />
        </div>
      </div>

      <div className="my-5 border-t border-slate-200" />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Amount */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card">
          <h2 className="text-base font-semibold text-slate-900">Amount</h2>
          <div className="my-4 border-t border-slate-200" />
          <div className="grid grid-cols-2 gap-5">
            <div>
              <div className="text-xs text-slate-500">Debit</div>
              <div className="mt-1 text-2xl font-bold text-slate-900 tabular-nums">
                {debit > 0 ? money(debit) : <span className="text-slate-300">—</span>}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Credit</div>
              <div className="mt-1 text-2xl font-bold text-slate-900 tabular-nums">
                {credit > 0 ? money(credit) : <span className="text-slate-300">—</span>}
              </div>
            </div>
          </div>
          {row.remarks && (
            <>
              <div className="my-4 border-t border-slate-200" />
              <div className="text-xs text-slate-500">Remarks</div>
              <p className="mt-1 text-sm leading-relaxed text-slate-700">{row.remarks}</p>
            </>
          )}
        </div>

        {/* Context */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card">
          <h2 className="text-base font-semibold text-slate-900">Account &amp; Period</h2>
          <div className="my-4 border-t border-slate-200" />
          <dl className="space-y-4 text-sm">
            <div className="flex items-start gap-3">
              <BookOpen size={16} className="mt-0.5 shrink-0 text-amber-600" />
              <div>
                <dt className="text-xs text-slate-500">General Ledger</dt>
                <dd className="text-slate-800">
                  <Link href={`/master/ledgers/${row.generalLedger.id}`} className="text-brand hover:underline">
                    {row.generalLedger.code} — {row.generalLedger.name}
                  </Link>
                </dd>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Layers size={16} className="mt-0.5 shrink-0 text-violet-600" />
              <div>
                <dt className="text-xs text-slate-500">Sub-Ledger</dt>
                <dd className="text-slate-800">
                  {row.subLedger ? (
                    <Link href={`/master/sub-ledgers/${row.subLedger.id}`} className="text-brand hover:underline">
                      {row.subLedger.code} — {row.subLedger.name}
                    </Link>
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin size={16} className="mt-0.5 shrink-0 text-blue-600" />
              <div>
                <dt className="text-xs text-slate-500">Branch</dt>
                <dd className="text-slate-800">{row.branch.name}</dd>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CalendarRange size={16} className="mt-0.5 shrink-0 text-slate-400" />
              <div>
                <dt className="text-xs text-slate-500">Fiscal Year</dt>
                <dd className="text-slate-800">{row.fiscalYear.code}</dd>
              </div>
            </div>
          </dl>
        </div>
      </div>

      {/* Carry-forward trail, shown only when this row participates in one. */}
      {(row.carriedForwardFrom || row._count.carriedForwardTo > 0) && (
        <div className="mt-5 rounded-xl border border-slate-200 bg-white p-6 shadow-card">
          <h2 className="text-base font-semibold text-slate-900">Carry-Forward</h2>
          <div className="my-4 border-t border-slate-200" />
          <div className="space-y-2 text-sm text-slate-600">
            {row.carriedForwardFrom && (
              <p>
                Rolled forward from the{" "}
                <Link
                  href={`/master/opening-balance/${row.carriedForwardFrom.id}`}
                  className="text-brand hover:underline"
                >
                  {row.carriedForwardFrom.fiscalYear.code}
                </Link>{" "}
                opening balance.
              </p>
            )}
            {row._count.carriedForwardTo > 0 && (
              <p>
                This entry has been carried forward into {row._count.carriedForwardTo} later fiscal year
                {row._count.carriedForwardTo === 1 ? " entry" : " entries"}, so it can&apos;t be deleted until those are
                removed.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
