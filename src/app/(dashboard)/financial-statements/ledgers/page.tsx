import Link from "next/link";
import { BookOpen, Landmark } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCompanyContext } from "@/lib/companyContext";
import { computeGeneralLedgerStatement } from "@/lib/reports";
import LedgerPicker from "@/components/reports/LedgerPicker";

export const dynamic = "force-dynamic";

export default async function GeneralLedgerPage({
  searchParams,
}: {
  searchParams: Promise<{ generalLedgerId?: string }>;
}) {
  const { generalLedgerId: glIdParam } = await searchParams;
  const generalLedgerId = glIdParam ? Number(glIdParam) : null;

  const { companyId, branchId, fiscalYearId } = await getCompanyContext();
  const fiscalYear =
    companyId && fiscalYearId ? await prisma.fiscalYear.findUnique({ where: { id: fiscalYearId } }) : null;

  const needsSetup = !companyId || !fiscalYear;

  const ledger =
    companyId && generalLedgerId
      ? await prisma.generalLedger.findFirst({
          where: { id: generalLedgerId, companyId },
          select: {
            id: true,
            code: true,
            name: true,
            normalBalance: true,
            isCashOrBank: true,
            accountSubGroup: { select: { description: true, accountGroup: { select: { description: true } } } },
            party: { select: { id: true, phone: true, mobile: true, email: true, contactPerson: true } },
          },
        })
      : null;

  const statement =
    companyId && fiscalYear && ledger
      ? await computeGeneralLedgerStatement(prisma, companyId, branchId, fiscalYear.id, fiscalYear.code, ledger.id)
      : null;

  // Same net-then-split approach as Trial Balance, but here it's also
  // shown as a per-line running balance as we walk down the statement.
  let running = statement ? statement.openingDebit - statement.openingCredit : 0;
  const rowsWithRunning =
    statement?.lines.map((l) => {
      running += l.debit - l.credit;
      return { ...l, runningBalance: running };
    }) ?? [];

  const closingDebit = running > 0 ? running : 0;
  const closingCredit = running < 0 ? -running : 0;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Ledgers</h1>
      <p className="mt-1 text-sm text-slate-500">Pick an account to see its opening balance and full statement.</p>

      <div className="my-5 border-t border-slate-200" />

      {needsSetup ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
          Select a company and fiscal year in the header to view ledger statements.
        </div>
      ) : (
        <>
          <LedgerPicker selectedId={ledger?.id ?? null} />

          {!ledger ? (
            <div className="mt-6 flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white py-16 text-center shadow-card">
              <BookOpen size={28} className="text-slate-300" />
              <p className="mt-3 text-sm text-slate-500">Search and pick an account above to see its statement.</p>
            </div>
          ) : (
            <>
              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card sm:col-span-2">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold text-slate-900">
                      {ledger.code} — {ledger.name}
                    </h2>
                    {ledger.isCashOrBank && <Landmark size={15} className="text-blue-500" />}
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    {ledger.accountSubGroup.accountGroup.description} &gt; {ledger.accountSubGroup.description}
                  </p>
                  {ledger.party && (
                    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 border-t border-slate-100 pt-3 text-xs text-slate-500">
                      {ledger.party.contactPerson && <span>Contact: {ledger.party.contactPerson}</span>}
                      {ledger.party.phone && <span>Phone: {ledger.party.phone}</span>}
                      {ledger.party.mobile && <span>Mobile: {ledger.party.mobile}</span>}
                      {ledger.party.email && <span>Email: {ledger.party.email}</span>}
                    </div>
                  )}
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
                  <div className="text-sm text-slate-500">Closing Balance</div>
                  <div className="mt-1.5 text-xl font-semibold tabular-nums text-slate-900">
                    {closingDebit > 0 ? `${closingDebit.toFixed(2)} Dr` : closingCredit > 0 ? `${closingCredit.toFixed(2)} Cr` : "0.00"}
                  </div>
                  <div className="mt-1 text-xs text-slate-400">FY {fiscalYear!.code}</div>
                </div>
              </div>

              <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-card">
                <table className="w-full min-w-[820px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs font-medium uppercase tracking-wide text-slate-500">
                      <th className="px-5 py-3">Date</th>
                      <th className="px-3 py-3">Voucher</th>
                      <th className="px-3 py-3">Description</th>
                      <th className="px-3 py-3 text-right">Debit</th>
                      <th className="px-3 py-3 text-right">Credit</th>
                      <th className="px-5 py-3 text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr className="bg-slate-50/60">
                      <td colSpan={5} className="px-5 py-2.5 text-sm font-medium text-slate-600">
                        Opening Balance
                      </td>
                      <td className="px-5 py-2.5 text-right text-sm font-medium tabular-nums text-slate-700">
                        {statement!.openingDebit > 0
                          ? `${statement!.openingDebit.toFixed(2)} Dr`
                          : statement!.openingCredit > 0
                            ? `${statement!.openingCredit.toFixed(2)} Cr`
                            : "0.00"}
                      </td>
                    </tr>
                    {rowsWithRunning.map((l) => (
                      <tr key={`${l.source}-${l.id}`} className="hover:bg-slate-50/60">
                        <td className="px-5 py-3 text-slate-600">{l.voucherDate.toISOString().slice(0, 10)}</td>
                        <td className="px-3 py-3">
                          <Link
                            href={
                              l.source === "JOURNAL"
                                ? `/transactions/journal-voucher/${l.voucherId}`
                                : `/transactions/cash-bank-voucher/${l.voucherId}`
                            }
                            className="font-medium text-brand hover:underline"
                          >
                            {l.voucherNumber}
                          </Link>
                          <span className="ml-1.5 text-xs text-slate-400">
                            {l.source === "JOURNAL" ? "JV" : "CB"}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-slate-600">{l.narration ?? "—"}</td>
                        <td className="px-3 py-3 text-right tabular-nums text-slate-700">
                          {l.debit > 0 ? l.debit.toFixed(2) : ""}
                        </td>
                        <td className="px-3 py-3 text-right tabular-nums text-slate-700">
                          {l.credit > 0 ? l.credit.toFixed(2) : ""}
                        </td>
                        <td className="px-5 py-3 text-right tabular-nums text-slate-800">
                          {l.runningBalance >= 0 ? `${l.runningBalance.toFixed(2)} Dr` : `${Math.abs(l.runningBalance).toFixed(2)} Cr`}
                        </td>
                      </tr>
                    ))}
                    {rowsWithRunning.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-5 py-10 text-center text-sm text-slate-400">
                          No posted transactions against this ledger yet in FY {fiscalYear!.code}.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
