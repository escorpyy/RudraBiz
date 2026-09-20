import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCompanyContext } from "@/lib/companyContext";
import JournalVoucherForm from "@/components/journal-vouchers/JournalVoucherForm";

export const dynamic = "force-dynamic";

export default async function EditJournalVoucherPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { companyId, fiscalYearId } = await getCompanyContext();

  const [voucher, branches, fiscalYear] = await Promise.all([
    companyId
      ? prisma.journalVoucher.findFirst({
          where: { id: Number(id), companyId },
          include: { lines: { orderBy: { lineNumber: "asc" } } },
        })
      : Promise.resolve(null),
    companyId
      ? prisma.branch.findMany({ where: { companyId, isActive: true }, orderBy: { name: "asc" } })
      : Promise.resolve([]),
    companyId && fiscalYearId
      ? prisma.fiscalYear.findFirst({ where: { id: fiscalYearId, companyId } })
      : Promise.resolve(null),
  ]);

  if (!voucher) notFound();

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-sm">
            <Link href="/transactions/journal-voucher" className="text-brand hover:underline">
              Journal Voucher
            </Link>
            <span className="text-slate-400">&gt;</span>
            <Link href={`/transactions/journal-voucher/${voucher.id}`} className="text-brand hover:underline">
              {voucher.voucherNumber}
            </Link>
            <span className="text-slate-400">&gt;</span>
            <span className="text-slate-500">Edit</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">Edit Journal Voucher</h1>
        </div>
        <Link
          href={`/transactions/journal-voucher/${voucher.id}`}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <ArrowLeft size={16} />
          Back
        </Link>
      </div>

      <div className="my-5 border-t border-slate-200" />

      {voucher.isPosted ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
          This voucher is posted and can no longer be edited.
        </div>
      ) : (
        <JournalVoucherForm
          initial={{
            id: voucher.id,
            branchId: voucher.branchId,
            voucherNumber: voucher.voucherNumber,
            voucherDate: voucher.voucherDate.toISOString().slice(0, 10),
            remarks: voucher.remarks ?? "",
            reversalOfId: voucher.reversalOfId,
            lines: voucher.lines.map((line) => ({
              generalLedgerId: String(line.generalLedgerId),
              debit: Number(line.debit) > 0 ? String(Number(line.debit)) : "",
              credit: Number(line.credit) > 0 ? String(Number(line.credit)) : "",
              narration: line.narration ?? "",
              agentId: line.agentId ? String(line.agentId) : "",
            })),
          }}
          branches={branches.map((b) => ({ id: b.id, code: b.code, name: b.name, isHeadOffice: b.isHeadOffice }))}
          defaultBranchId={voucher.branchId}
          fiscalYearCode={fiscalYear?.code ?? voucher.fiscalYear}
        />
      )}
    </div>
  );
}
