import { Info, BookOpen, Users } from "lucide-react";

export default function SubLedgerInfoPanel() {
  return (
    <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-5">
      <div className="flex items-start gap-2.5">
        <Info size={18} className="mt-0.5 shrink-0 text-blue-600" />
        <div>
          <div className="font-semibold text-blue-700">About Sub-Ledgers</div>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
            Sub-Ledgers give finer detail below a General Ledger — used where a
            ledger has &quot;Requires Sub-Ledger&quot; enabled and postings need
            to be tracked per party or per scheme rather than at the GL level
            alone.
          </p>
        </div>
      </div>

      <div className="my-5 border-t border-blue-100" />

      <div className="text-sm font-semibold text-slate-900">Link Options</div>

      <div className="mt-4 space-y-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100">
            <BookOpen size={16} className="text-amber-600" />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-900">General Ledger</div>
            <div className="text-xs text-slate-500">Ties this sub-ledger to a specific GL account.</div>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-100">
            <Users size={16} className="text-violet-600" />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-900">Party</div>
            <div className="text-xs text-slate-500">Ties this sub-ledger to a customer or vendor.</div>
          </div>
        </div>
      </div>

      <p className="mt-4 text-xs text-slate-500">Both links are optional and can be used independently.</p>
    </div>
  );
}
