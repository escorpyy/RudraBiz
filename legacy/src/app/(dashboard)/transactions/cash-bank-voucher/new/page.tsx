import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCompanyContext } from "@/lib/companyContext";
import CashBankVoucherForm from "@/components/cash-bank-vouchers/CashBankVoucherForm";

export const dynamic = "force-dynamic";

export default async function NewCashBankVoucherPage() {
  const { companyId, branchId, fiscalYearId } = await getCompanyContext();

  const [branches, fiscalYear] = await Promise.all([
    companyId
      ? prisma.branch.findMany({ where: { companyId, isActive: true }, orderBy: { name: "asc" } })
      : Promise.resolve([]),
    companyId && fiscalYearId
      ? prisma.fiscalYear.findFirst({ where: { id: fiscalYearId, companyId } })
      : Promise.resolve(null),
  ]);

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-sm">
            <span className="text-slate-500">Transactions</span>
            <span className="text-slate-400">&gt;</span>
            <Link href="/transactions/cash-bank-voucher" className="text-brand hover:underline">
              Cash / Bank Voucher
            </Link>
          </div>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">New Cash / Bank Voucher</h1>
        </div>
        <Link
          href="/transactions/cash-bank-voucher"
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <ArrowLeft size={16} />
          Back to List
        </Link>
      </div>

      <div className="my-5 border-t border-slate-200" />

      {!fiscalYear || branches.length === 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
          Select a company and fiscal year in the header, and make sure at least one active branch
          exists, before recording cash/bank vouchers.
        </div>
      ) : (
        <CashBankVoucherForm
          branches={branches.map((b) => ({ id: b.id, code: b.code, name: b.name, isHeadOffice: b.isHeadOffice }))}
          defaultBranchId={branchId}
          fiscalYearCode={fiscalYear.code}
        />
      )}
    </div>
  );
}
