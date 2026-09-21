import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, MapPin, Undo2, Landmark } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCompanyContext } from "@/lib/companyContext";
import DetailActions from "@/components/shared/DetailActions";
import PostVoucherButton from "@/components/shared/PostVoucherButton";

export const dynamic = "force-dynamic";

const INSTRUMENT_LABELS: Record<string, string> = {
  CHEQUE: "Cheque",
  RTGS: "RTGS",
  ONLINE_TRANSFER: "Online Transfer",
  OTHER: "Other",
};

export default async function ViewCashBankVoucherPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { companyId } = await getCompanyContext();
  if (!companyId) notFound();

  const voucher = await prisma.cashBankVoucher.findFirst({
    where: { id: Number(id), companyId },
    include: {
      branch: { select: { name: true, code: true } },
      reversalOf: { select: { id: true, voucherNumber: true } },
      lines: {
        orderBy: { lineNumber: "asc" },
        include: {
          generalLedger: { select: { id: true, code: true, name: true, isCashOrBank: true } },
          agent: { select: { name: true } },
        },
      },
    },
  });
  if (!voucher) notFound();

  const lines = voucher.lines.map((l) => ({
    ...l,
    debit: Number(l.debit),
    credit: Number(l.credit),
  }));
  const totalDebit = lines.reduce((sum, l) => sum + l.debit, 0);
  const totalCredit = lines.reduce((sum, l) => sum + l.credit, 0);

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">{voucher.voucherNumber}</h1>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                voucher.isPosted ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
              }`}
            >
              {voucher.isPosted ? "Posted" : "Draft"}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-sm">
            <Link href="/transactions/cash-bank-voucher" className="text-brand hover:underline">
              Cash / Bank Voucher
            </Link>
            <span className="text-slate-400">&gt;</span>
            <span className="text-slate-500">{voucher.voucherNumber}</span>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            href="/transactions/cash-bank-voucher"
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft size={16} />
            Back
          </Link>
          {!voucher.isPosted && (
            <>
              <PostVoucherButton apiUrl={`/api/cash-bank-vouchers/${voucher.id}`} voucherNumber={voucher.voucherNumber} />
              <DetailActions
                editHref={`/transactions/cash-bank-voucher/${voucher.id}/edit`}
                deleteUrl={`/api/cash-bank-vouchers/${voucher.id}`}
                redirectHref="/transactions/cash-bank-voucher"
                entityName={voucher.voucherNumber}
              />
            </>
          )}
        </div>
      </div>

      <div className="my-5 border-t border-slate-200" />

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <CalendarDays size={15} />
            Voucher Date
          </div>
          <div className="mt-1.5 text-lg font-semibold text-slate-900">
            {voucher.voucherDate.toISOString().slice(0, 10)}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <MapPin size={15} />
            Branch
          </div>
          <div className="mt-1.5 text-lg font-semibold text-slate-900">{voucher.branch.name}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
          <div className="text-sm text-slate-500">Fiscal Year</div>
          <div className="mt-1.5 text-lg font-semibold text-slate-900">{voucher.fiscalYear}</div>
        </div>
      </div>

      {voucher.reversalOf && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-600">
          <Undo2 size={15} />
          Reverses{" "}
          <Link href={`/transactions/cash-bank-voucher/${voucher.reversalOf.id}`} className="font-medium text-brand hover:underline">
            {voucher.reversalOf.voucherNumber}
          </Link>
        </div>
      )}

      {/* Lines */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-card">
        <h2 className="text-base font-semibold text-slate-900">Voucher Entries</h2>
        <div className="my-5 border-t border-slate-200" />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-separate border-spacing-0 text-sm">
            <thead>
              <tr className="text-left text-xs font-medium text-slate-500">
                <th className="w-8 pb-2">#</th>
                <th className="pb-2 pr-3">Account Head</th>
                <th className="pb-2 pr-3">Instrument</th>
                <th className="pb-2 pr-3">Agent</th>
                <th className="pb-2 pr-3">Description</th>
                <th className="pb-2 pr-3 text-right">Debit</th>
                <th className="pb-2 text-right">Credit</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((l, i) => (
                <tr key={l.id} className="border-t border-slate-100">
                  <td className="py-2.5 pr-3 text-slate-400">{i + 1}</td>
                  <td className="py-2.5 pr-3">
                    <div className="flex items-center gap-1.5 font-medium text-slate-800">
                      {l.generalLedger.code} — {l.generalLedger.name}
                      {l.generalLedger.isCashOrBank && <Landmark size={12} className="text-blue-500" />}
                    </div>
                  </td>
                  <td className="py-2.5 pr-3 text-slate-600">
                    {l.instrumentType ? (
                      <div>
                        <div>{INSTRUMENT_LABELS[l.instrumentType] ?? l.instrumentType}</div>
                        {l.chequeNumber && (
                          <div className="text-xs text-slate-400">
                            #{l.chequeNumber}
                            {l.chequeDate ? ` · ${l.chequeDate.toISOString().slice(0, 10)}` : ""}
                            {l.chequeBankName ? ` · ${l.chequeBankName}` : ""}
                          </div>
                        )}
                      </div>
                    ) : l.generalLedger.isCashOrBank ? (
                      "Cash"
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="py-2.5 pr-3 text-slate-600">{l.agent?.name ?? "—"}</td>
                  <td className="py-2.5 pr-3 text-slate-600">{l.narration ?? "—"}</td>
                  <td className="py-2.5 pr-3 text-right tabular-nums text-slate-800">
                    {l.debit > 0 ? l.debit.toFixed(2) : ""}
                  </td>
                  <td className="py-2.5 text-right tabular-nums text-slate-800">
                    {l.credit > 0 ? l.credit.toFixed(2) : ""}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-slate-200 font-semibold text-slate-900">
                <td colSpan={5} className="py-3 pr-3 text-right">
                  Total
                </td>
                <td className="py-3 pr-3 text-right tabular-nums">{totalDebit.toFixed(2)}</td>
                <td className="py-3 text-right tabular-nums">{totalCredit.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {voucher.remarks && (
          <>
            <div className="my-5 border-t border-slate-200" />
            <div className="text-sm font-medium text-slate-800">Notes</div>
            <p className="mt-1 text-sm text-slate-600">{voucher.remarks}</p>
          </>
        )}
      </div>
    </div>
  );
}
