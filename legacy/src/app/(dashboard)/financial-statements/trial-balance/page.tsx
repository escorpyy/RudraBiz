import Link from "next/link";
import { Scale, CheckCircle2, AlertTriangle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCompanyContext } from "@/lib/companyContext";
import { computeTrialBalance } from "@/lib/reports";

export const dynamic = "force-dynamic";

export default async function TrialBalancePage() {
  const { companyId, branchId, fiscalYearId } = await getCompanyContext();

  const fiscalYear =
    companyId && fiscalYearId ? await prisma.fiscalYear.findUnique({ where: { id: fiscalYearId } }) : null;

  const rows =
    companyId && fiscalYear
      ? await computeTrialBalance(prisma, companyId, branchId, fiscalYear.id, fiscalYear.code)
      : [];

  const totals = rows.reduce(
    (acc, r) => ({
      openingDebit: acc.openingDebit + r.openingDebit,
      openingCredit: acc.openingCredit + r.openingCredit,
      periodDebit: acc.periodDebit + r.periodDebit,
      periodCredit: acc.periodCredit + r.periodCredit,
      closingDebit: acc.closingDebit + r.closingDebit,
      closingCredit: acc.closingCredit + r.closingCredit,
    }),
    { openingDebit: 0, openingCredit: 0, periodDebit: 0, periodCredit: 0, closingDebit: 0, closingCredit: 0 }
  );
  const balanced = Math.round((totals.closingDebit - totals.closingCredit) * 100) === 0;

  const needsSetup = !companyId || !fiscalYear;

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Trial Balance</h1>
          <p className="mt-1 text-sm text-slate-500">
            Opening, period movement and closing balance for every ledger with activity this fiscal year.
          </p>
        </div>
        {!needsSetup && (
          <div
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium ${
              balanced ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
            }`}
          >
            {balanced ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
            {balanced ? "Balanced" : "Out of balance"}
          </div>
        )}
      </div>

      <div className="my-5 border-t border-slate-200" />

      {needsSetup ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
          Select a company and fiscal year in the header to view the Trial Balance.
        </div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white py-16 text-center shadow-card">
          <Scale size={28} className="text-slate-300" />
          <p className="mt-3 text-sm text-slate-500">
            No opening balances or posted vouchers yet for FY {fiscalYear!.code}.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-card">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-medium uppercase tracking-wide text-slate-500">
                <th className="px-5 py-3">Ledger</th>
                <th className="px-3 py-3">Group</th>
                <th className="px-3 py-3 text-right">Opening Dr</th>
                <th className="px-3 py-3 text-right">Opening Cr</th>
                <th className="px-3 py-3 text-right">Period Dr</th>
                <th className="px-3 py-3 text-right">Period Cr</th>
                <th className="px-3 py-3 text-right">Closing Dr</th>
                <th className="px-5 py-3 text-right">Closing Cr</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r) => (
                <tr key={r.generalLedgerId} className="hover:bg-slate-50/60">
                  <td className="px-5 py-3">
                    <Link
                      href={`/financial-statements/ledgers?generalLedgerId=${r.generalLedgerId}`}
                      className="font-medium text-slate-800 hover:text-brand hover:underline"
                    >
                      {r.code} — {r.name}
                    </Link>
                  </td>
                  <td className="px-3 py-3 text-slate-500">{r.groupPath}</td>
                  <td className="px-3 py-3 text-right tabular-nums text-slate-700">
                    {r.openingDebit > 0 ? r.openingDebit.toFixed(2) : ""}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums text-slate-700">
                    {r.openingCredit > 0 ? r.openingCredit.toFixed(2) : ""}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums text-slate-700">
                    {r.periodDebit > 0 ? r.periodDebit.toFixed(2) : ""}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums text-slate-700">
                    {r.periodCredit > 0 ? r.periodCredit.toFixed(2) : ""}
                  </td>
                  <td className="px-3 py-3 text-right font-medium tabular-nums text-emerald-700">
                    {r.closingDebit > 0 ? r.closingDebit.toFixed(2) : ""}
                  </td>
                  <td className="px-5 py-3 text-right font-medium tabular-nums text-blue-700">
                    {r.closingCredit > 0 ? r.closingCredit.toFixed(2) : ""}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-slate-200 bg-slate-50 font-semibold text-slate-900">
                <td colSpan={2} className="px-5 py-3">
                  Total
                </td>
                <td className="px-3 py-3 text-right tabular-nums">{totals.openingDebit.toFixed(2)}</td>
                <td className="px-3 py-3 text-right tabular-nums">{totals.openingCredit.toFixed(2)}</td>
                <td className="px-3 py-3 text-right tabular-nums">{totals.periodDebit.toFixed(2)}</td>
                <td className="px-3 py-3 text-right tabular-nums">{totals.periodCredit.toFixed(2)}</td>
                <td className="px-3 py-3 text-right tabular-nums text-emerald-700">{totals.closingDebit.toFixed(2)}</td>
                <td className="px-5 py-3 text-right tabular-nums text-blue-700">{totals.closingCredit.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
