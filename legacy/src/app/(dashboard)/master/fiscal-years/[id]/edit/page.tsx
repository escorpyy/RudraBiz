import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCompanyContext } from "@/lib/companyContext";
import FiscalYearForm from "@/components/fiscal-years/FiscalYearForm";

export const dynamic = "force-dynamic";

export default async function EditFiscalYearPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { companyId } = await getCompanyContext();
  if (!companyId) notFound();
  const fiscalYear = await prisma.fiscalYear.findFirst({ where: { id: Number(id), companyId } });
  if (!fiscalYear) notFound();

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Edit Fiscal Year</h1>
          <div className="mt-1 flex items-center gap-1.5 text-sm">
            <Link href="/master/fiscal-years" className="text-brand hover:underline">
              Fiscal Year Master
            </Link>
            <span className="text-slate-400">&gt;</span>
            <span className="text-slate-500">Edit {fiscalYear.code}</span>
          </div>
        </div>
        <Link
          href={`/master/fiscal-years/${fiscalYear.id}`}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <ArrowLeft size={16} />
          Back to Fiscal Year
        </Link>
      </div>

      <div className="my-5 border-t border-slate-200" />

      <div className="max-w-2xl">
        <FiscalYearForm
          initial={{
            id: fiscalYear.id,
            code: fiscalYear.code,
            startDate: fiscalYear.startDate.toISOString().slice(0, 10),
            endDate: fiscalYear.endDate.toISOString().slice(0, 10),
            isCurrent: fiscalYear.isCurrent,
            isClosed: fiscalYear.isClosed,
            isOpeningBalanceLocked: fiscalYear.isOpeningBalanceLocked,
            status: fiscalYear.isActive ? "ACTIVE" : "INACTIVE",
          }}
        />
      </div>
    </div>
  );
}
