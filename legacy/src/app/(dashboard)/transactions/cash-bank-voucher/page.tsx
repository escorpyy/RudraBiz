import Link from "next/link";
import { Plus, Landmark, CheckCircle2, Clock3, Wallet } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCompanyContext } from "@/lib/companyContext";
import StatCard from "@/components/account-groups/StatCard";
import VouchersTable, { type VoucherRow } from "@/components/shared/VouchersTable";

export const dynamic = "force-dynamic";

export default async function CashBankVoucherListPage() {
  const { companyId, branchId, fiscalYearId } = await getCompanyContext();

  const fiscalYear =
    companyId && fiscalYearId ? await prisma.fiscalYear.findUnique({ where: { id: fiscalYearId } }) : null;

  const vouchers = companyId
    ? await prisma.cashBankVoucher.findMany({
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

  const rows: VoucherRow[] = vouchers.map((v) => ({
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
          <h1 className="text-2xl font-bold text-slate-900">Cash / Bank Voucher</h1>
          <p className="mt-1 text-sm text-slate-500">
            Record payments and receipts — every voucher here touches at least one cash or bank account.
          </p>
        </div>
        <Link
          href="/transactions/cash-bank-voucher/new"
          className="flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-hover"
        >
          <Plus size={16} />
          New Cash / Bank Voucher
        </Link>
      </div>

      {needsSetup ? (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
          Select a company and fiscal year in the header before recording cash/bank vouchers.
        </div>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-4">
            <StatCard icon={Wallet} iconBg="bg-blue-100" iconColor="text-blue-600" label="Total Vouchers" value={rows.length} caption="This fiscal year" />
            <StatCard icon={CheckCircle2} iconBg="bg-emerald-100" iconColor="text-emerald-600" label="Posted" value={postedCount} caption="Locked, final entries" />
            <StatCard icon={Clock3} iconBg="bg-amber-100" iconColor="text-amber-600" label="Draft" value={draftCount} caption="Still editable" />
            <StatCard icon={Landmark} iconBg="bg-violet-100" iconColor="text-violet-600" label="Posted Amount" value={Math.round(totalPosted)} caption="Total Dr across posted vouchers" />
          </div>

          <div className="mt-6">
            <VouchersTable rows={rows} basePath="/transactions/cash-bank-voucher" apiPath="/api/cash-bank-vouchers" noun="cash/bank voucher" />
          </div>
        </>
      )}
    </div>
  );
}
