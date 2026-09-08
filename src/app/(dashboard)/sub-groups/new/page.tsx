import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import SubGroupForm from "@/components/sub-groups/SubGroupForm";
import InfoPanel from "@/components/account-groups/InfoPanel";

// SubGroupForm reads useSearchParams (to prefill accountGroupId), which
// requires this route not be statically prerendered.
export const dynamic = "force-dynamic";

export default function NewSubGroupPage() {
  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Add New Sub-Group</h1>
          <div className="mt-1 flex items-center gap-1.5 text-sm">
            <Link href="/sub-groups" className="text-brand hover:underline">
              Sub-Groups
            </Link>
            <span className="text-slate-400">&gt;</span>
            <span className="text-slate-500">Add New Sub-Group</span>
          </div>
        </div>
        <Link
          href="/sub-groups"
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <ArrowLeft size={16} />
          Back to Sub-Groups
        </Link>
      </div>

      <div className="my-5 border-t border-slate-200" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
        <SubGroupForm />
        <InfoPanel />
      </div>
    </div>
  );
}
