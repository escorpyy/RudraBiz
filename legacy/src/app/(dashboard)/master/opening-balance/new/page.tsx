import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCompanyContext } from "@/lib/companyContext";
import OpeningBalanceForm from "@/components/opening-balances/OpeningBalanceForm";
import OpeningBalanceInfoPanel from "@/components/opening-balances/OpeningBalanceInfoPanel";

export const dynamic = "force-dynamic";

export default async function NewOpeningBalancePage() {
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
          <h1 className="text-2xl font-bold text-slate-900">New Opening Balance</h1>
          <div className="mt-1 flex items-center gap-1.5 text-sm">
            <Link href="/master/opening-balance" className="text-brand hover:underline">
              Opening Balance Master
            </Link>
            <span className="text-slate-400">&gt;</span>
            <span className="text-slate-500">New</span>
          </div>
        </div>
        <Link
          href="/master/opening-balance"
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <ArrowLeft size={16} />
          Back to List
        </Link>
      </div>

      <div className="my-5 border-t border-slate-200" />

      {!fiscalYear ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
          Select a company and fiscal year in the header before recording opening balances.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
          <OpeningBalanceForm
            branches={branches.map((b) => ({ id: b.id, code: b.code, name: b.name }))}
            fiscalYearCode={fiscalYear.code}
            defaultBranchId={branchId}
          />
          <OpeningBalanceInfoPanel />
        </div>
      )}
    </div>
  );
}
