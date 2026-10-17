import Link from "next/link";
import { Plus, Scale, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCompanyContext } from "@/lib/companyContext";
import StatCard from "@/components/account-groups/StatCard";
import BalanceIndicator from "@/components/shared/BalanceIndicator";
import OpeningBalancesTable, { type OpeningBalanceRow } from "@/components/opening-balances/OpeningBalancesTable";

export const dynamic = "force-dynamic";

export default async function OpeningBalancePage() {
  const { companyId, branchId, fiscalYearId } = await getCompanyContext();

  const [rows, fiscalYear] = await Promise.all([
    companyId && fiscalYearId
      ? prisma.openingBalance.findMany({
          where: {
            companyId,
            fiscalYearId,
            ...(branchId === null ? {} : { branchId }),
          },
          orderBy: { generalLedger: { code: "asc" } },
          include: {
            generalLedger: { select: { id: true, code: true, name: true } },
            subLedger: { select: { name: true } },
            branch: { select: { name: true } },
          },
        })
      : Promise.resolve([]),
    companyId && fiscalYearId
      ? prisma.fiscalYear.findFirst({ where: { id: fiscalYearId, companyId } })
      : Promise.resolve(null),
  ]);

  // Prisma returns Decimal for money columns; convert once here so the
  // client components stay plain-number and serializable.
  const tableRows: OpeningBalanceRow[] = rows.map((row) => ({
    id: row.id,
    generalLedgerId: row.generalLedger.id,
    generalLedgerCode: row.generalLedger.code,
    generalLedgerName: row.generalLedger.name,
    subLedgerName: row.subLedger?.name ?? null,
    branchName: row.branch.name,
    debit: Number(row.debit),
    credit: Number(row.credit),
    remarks: row.remarks,
    isCarriedForward: row.carriedForwardFromId !== null,
  }));

  const totalDebit = tableRows.reduce((sum, r) => sum + r.debit, 0);
  const totalCredit = tableRows.reduce((sum, r) => sum + r.credit, 0);
  const debitEntries = tableRows.filter((r) => r.debit > 0).length;
  const creditEntries = tableRows.filter((r) => r.credit > 0).length;

  const generalLedgerOptions = Array.from(
    new Map(tableRows.map((r) => [r.generalLedgerId, { id: r.generalLedgerId, name: r.generalLedgerName }])).values()
  ).sort((a, b) => a.name.localeCompare(b.name));

  const needsSetup = !companyId || !fiscalYearId;

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Opening Balance Master</h1>
          <p className="mt-1 text-sm text-slate-500">
            {fiscalYear
              ? `Opening balances for fiscal year ${fiscalYear.code}${branchId === null ? " across all branches" : ""}.`
              : "Opening balances for the selected fiscal year."}
          </p>
        </div>
        {!needsSetup && (
          <Link
            href="/master/opening-balance/new"
            className="flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-hover"
          >
            <Plus size={16} />
            New Opening Balance
          </Link>
        )}
      </div>

      <div className="my-5 border-t border-slate-200" />

      {needsSetup ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
          Select a company and fiscal year in the header before recording opening balances.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <StatCard
              icon={Scale}
              iconBg="bg-blue-100"
              iconColor="text-blue-600"
              label="Total Entries"
              value={tableRows.length}
              caption="Opening balance rows"
            />
            <StatCard
              icon={ArrowDownLeft}
              iconBg="bg-emerald-100"
              iconColor="text-emerald-600"
              label="Debit Entries"
              value={debitEntries}
              caption="Rows with a debit balance"
            />
            <StatCard
              icon={ArrowUpRight}
              iconBg="bg-rose-100"
              iconColor="text-rose-600"
              label="Credit Entries"
              value={creditEntries}
              caption="Rows with a credit balance"
            />
          </div>

          <div className="mt-5">
            <BalanceIndicator totalDebit={totalDebit} totalCredit={totalCredit} />
          </div>

          <div className="mt-5">
            <OpeningBalancesTable
              rows={tableRows}
              generalLedgerOptions={generalLedgerOptions}
              showBranchColumn={branchId === null}
            />
          </div>
        </>
      )}
    </div>
  );
}
