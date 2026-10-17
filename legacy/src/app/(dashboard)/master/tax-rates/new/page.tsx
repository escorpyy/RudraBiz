import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import TaxRateForm from "@/components/tax-rates/TaxRateForm";

export const dynamic = "force-dynamic";

export default function NewTaxRatePage() {
  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Add New Tax Rate</h1>
          <div className="mt-1 flex items-center gap-1.5 text-sm">
            <Link href="/master/tax-rates" className="text-brand hover:underline">
              Tax Rate Master
            </Link>
            <span className="text-slate-400">&gt;</span>
            <span className="text-slate-500">Add New Tax Rate</span>
          </div>
        </div>
        <Link
          href="/master/tax-rates"
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <ArrowLeft size={16} />
          Back to Tax Rates
        </Link>
      </div>

      <div className="my-5 border-t border-slate-200" />

      <div className="max-w-2xl">
        <TaxRateForm />
      </div>
    </div>
  );
}
