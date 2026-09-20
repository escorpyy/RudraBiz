import Link from "next/link";
import { Plus, BookOpen, CheckCircle2, Clock3, Landmark } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCompanyContext } from "@/lib/companyContext";
import StatCard from "@/components/account-groups/StatCard";
import JournalVouchersTable, { type JournalVoucherRow } from "@/components/journal-vouchers/JournalVouchersTable";

export const dynamic = "force-dynamic";

export default async function JournalVoucherListPage() {
  const { companyId, branchId, fiscalYearId } = await getCompanyContext();

  const fiscalYear =
    companyId && fiscalYearId ? await prisma.fiscalYear.findUnique({ where: { id: fiscalYearId } }) : null;

  const vouchers = companyId
    ? await prisma.journalVoucher.findMany({
        where: {
          companyId,
          ...(fiscalYear ? { fiscalYear: fiscalYear.code } : {}),
          ...(branchId === null ? {} : { branchId }),
        },
        orderBy: [{ voucherDate: "desc" }, { id: "desc" }],
        include: {
          branch: { select: { name: true } },
          lines: { select: { debit: true } },
        },
      })
    : [];

  // Prisma returns Decimal for money columns; convert once here so the
  // client table stays plain-number and serializable.
  const rows: JournalVoucherRow[] = vouchers.map((v) => ({
    id: v.id,
    voucherNumber: v.voucherNumber,
    voucherDate: v.voucherDate.toISOString().slice(0, 10),
    branchName: v.branch.name,
    totalDebit: v.lines.reduce((sum, l) => sum + Number(l.debit), 0),
    isPosted: v.isPosted,
    remarks: v.remarks,
  }));

  const postedCount = rows.filter((r) => r.isPosted).length;
  const draftCount = rows.length - postedCount;
  const totalPosted = rows.filter((r) => r.isPosted).reduce((sum, r) => sum + r.totalDebit, 0);

  const needsSetup = !companyId || !fiscalYearId;

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Journal Voucher</h1>
          <p className="mt-1 text-sm text-slate-500">
            Record manual journal entries — adjustments, accruals, prepayments and other non-cash transactions.
          </p>
        </div>
        <Link
          href="/transactions/journal-voucher/new"
          className="flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-hover"
        >
          <Plus size={16} />
          New Journal Voucher
        </Link>
      </div>

      {needsSetup ? (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
          Select a company and fiscal year in the header before recording journal vouchers.
        </div>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-4">
            <StatCard icon={BookOpen} iconBg="bg-blue-100" iconColor="text-blue-600" label="Total Vouchers" value={rows.length} caption="This fiscal year" />
            <StatCard icon={CheckCircle2} iconBg="bg-emerald-100" iconColor="text-emerald-600" label="Posted" value={postedCount} caption="Locked, final entries" />
            <StatCard icon={Clock3} iconBg="bg-amber-100" iconColor="text-amber-600" label="Draft" value={draftCount} caption="Still editable" />
            <StatCard icon={Landmark} iconBg="bg-violet-100" iconColor="text-violet-600" label="Posted Amount" value={Math.round(totalPosted)} caption="Total Dr across posted vouchers" />
          </div>

          <div className="mt-6">
            <JournalVouchersTable rows={rows} />
          </div>
        </>
      )}
    </div>
  );
}
