import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import TaxRateForm from "@/components/tax-rates/TaxRateForm";

export const dynamic = "force-dynamic";

export default async function EditTaxRatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const taxRate = await prisma.taxRate.findUnique({ where: { id: Number(id) } });
  if (!taxRate) notFound();

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Edit Tax Rate</h1>
          <div className="mt-1 flex items-center gap-1.5 text-sm">
            <Link href="/master/tax-rates" className="text-brand hover:underline">
              Tax Rate Master
            </Link>
            <span className="text-slate-400">&gt;</span>
            <span className="text-slate-500">Edit {taxRate.code}</span>
          </div>
        </div>
        <Link
          href={`/master/tax-rates/${taxRate.id}`}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <ArrowLeft size={16} />
          Back to Tax Rate
        </Link>
      </div>

      <div className="my-5 border-t border-slate-200" />

      <div className="max-w-2xl">
        <TaxRateForm
          initial={{
            id: taxRate.id,
            code: taxRate.code,
            name: taxRate.name,
            ratePercent: String(taxRate.ratePercent),
            hsnSacCode: taxRate.hsnSacCode ?? "",
            status: taxRate.isActive ? "ACTIVE" : "INACTIVE",
          }}
        />
      </div>
    </div>
  );
}
