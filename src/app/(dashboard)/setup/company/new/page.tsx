import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import CompanyForm from "@/components/companies/CompanyForm";
import CompanyInfoPanel from "@/components/companies/CompanyInfoPanel";

export const dynamic = "force-dynamic";

export default function NewCompanyPage() {
  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">New Company</h1>
          <div className="mt-1 flex items-center gap-1.5 text-sm">
            <Link href="/setup/company" className="text-brand hover:underline">
              Company
            </Link>
            <span className="text-slate-400">&gt;</span>
            <span className="text-slate-500">New</span>
          </div>
        </div>
        <Link
          href="/setup/company"
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <ArrowLeft size={16} />
          Back to List
        </Link>
      </div>

      <div className="my-5 border-t border-slate-200" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
        <CompanyForm />
        <CompanyInfoPanel />
      </div>
    </div>
  );
}
