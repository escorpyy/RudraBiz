import { Info, ExternalLink } from "lucide-react";

export default function AboutBanner() {
  return (
    <div className="mt-6 flex items-start justify-between gap-4 rounded-xl border border-blue-100 bg-blue-50/60 p-5">
      <div className="flex items-start gap-3">
        <Info size={18} className="mt-0.5 shrink-0 text-blue-600" />
        <div>
          <div className="font-semibold text-slate-900">About Account Groups</div>
          <p className="mt-1 text-sm text-slate-600">
            Groups represent the major categories of accounts in your chart of accounts.
            Each group can have multiple sub-groups, and each sub-group can have multiple
            ledgers.
          </p>
        </div>
      </div>
      <button className="flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
        Learn more
        <ExternalLink size={14} />
      </button>
    </div>
  );
}
