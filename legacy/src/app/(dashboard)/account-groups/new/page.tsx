import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import AccountGroupForm from "@/components/account-groups/AccountGroupForm";
import InfoPanel from "@/components/account-groups/InfoPanel";

export default function NewAccountGroupPage() {
  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Add New Account Group</h1>
          <div className="mt-1 flex items-center gap-1.5 text-sm">
            <Link href="/account-groups" className="text-brand hover:underline">
              Account Groups
            </Link>
            <span className="text-slate-400">&gt;</span>
            <span className="text-slate-500">Add New Group</span>
          </div>
        </div>
        <Link
          href="/account-groups"
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <ArrowLeft size={16} />
          Back to Groups
        </Link>
      </div>

      <div className="my-5 border-t border-slate-200" />

      {/* Content: form + info panel */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
        <AccountGroupForm />
        <InfoPanel />
      </div>
    </div>
  );
}
