import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCompanyContext } from "@/lib/companyContext";
import OpeningBalanceForm from "@/components/opening-balances/OpeningBalanceForm";
import OpeningBalanceInfoPanel from "@/components/opening-balances/OpeningBalanceInfoPanel";

export const dynamic = "force-dynamic";

/** Trims trailing zeros off a Decimal(18,6) so the number input shows "1500" not "1500.000000". */
function amountInput(value: unknown): string {
  const num = Number(value);
  if (!Number.isFinite(num) || num === 0) return "";
  return String(num);
}

export default async function EditOpeningBalancePage({
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
      generalLedger: { select: { code: true } },
      fiscalYear: { select: { code: true } },
    },
  });
  if (!row) notFound();

  const branches = await prisma.branch.findMany({
    where: { companyId, isActive: true },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Edit Opening Balance</h1>
          <div className="mt-1 flex items-center gap-1.5 text-sm">
            <Link href="/master/opening-balance" className="text-brand hover:underline">
              Opening Balance Master
            </Link>
            <span className="text-slate-400">&gt;</span>
            <span className="text-slate-500">Edit {row.generalLedger.code}</span>
          </div>
        </div>
        <Link
          href={`/master/opening-balance/${row.id}`}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <ArrowLeft size={16} />
          Back to Opening Balance
        </Link>
      </div>

      <div className="my-5 border-t border-slate-200" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
        <OpeningBalanceForm
          initial={{
            id: row.id,
            branchId: row.branchId,
            generalLedgerId: row.generalLedgerId,
            subLedgerId: row.subLedgerId,
            debit: amountInput(row.debit),
            credit: amountInput(row.credit),
            remarks: row.remarks ?? "",
          }}
          branches={branches.map((b) => ({ id: b.id, code: b.code, name: b.name }))}
          // The row's own fiscal year, not the switcher's — editing shouldn't
          // silently reassign the entry to whatever year is currently selected.
          fiscalYearCode={row.fiscalYear.code}
          defaultBranchId={row.branchId}
        />
        <OpeningBalanceInfoPanel />
      </div>
    </div>
  );
}
