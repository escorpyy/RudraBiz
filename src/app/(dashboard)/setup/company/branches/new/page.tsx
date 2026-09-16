import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import BranchForm from "@/components/companies/BranchForm";
import CompanyInfoPanel from "@/components/companies/CompanyInfoPanel";

export const dynamic = "force-dynamic";

export default async function NewBranchPage({
  searchParams,
}: {
  searchParams: Promise<{ companyId?: string }>;
}) {
  const { companyId } = await searchParams;
  const backHref = companyId ? `/setup/company/${companyId}` : "/setup/company";

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">New Branch</h1>
          <div className="mt-1 flex items-center gap-1.5 text-sm">
            <Link href="/setup/company" className="text-brand hover:underline">
              Company
            </Link>
            <span className="text-slate-400">&gt;</span>
            <span className="text-slate-500">New Branch</span>
          </div>
        </div>
        <Link
          href={backHref}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <ArrowLeft size={16} />
          Back
        </Link>
      </div>

      <div className="my-5 border-t border-slate-200" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
        <BranchForm />
        <CompanyInfoPanel />
      </div>
    </div>
  );
}
