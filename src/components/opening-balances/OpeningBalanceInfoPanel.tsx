import { Info, ArrowDownLeft, ArrowUpRight, Scale } from "lucide-react";

export default function OpeningBalanceInfoPanel() {
  return (
    <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-5">
      <div className="flex items-start gap-2.5">
        <Info size={18} className="mt-0.5 shrink-0 text-blue-600" />
        <div>
          <div className="font-semibold text-blue-700">About Opening Balances</div>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
            An opening balance is where a ledger starts at the beginning of a
            fiscal year — carried over from the previous year&apos;s closing
            balance, or typed in once when migrating from another system. Each
            entry belongs to one branch and one fiscal year, both taken from
            the header switcher.
          </p>
        </div>
      </div>

      <div className="my-5 border-t border-blue-100" />

      <div className="text-sm font-semibold text-slate-900">Entering Amounts</div>

      <div className="mt-4 space-y-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100">
            <ArrowDownLeft size={16} className="text-emerald-600" />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-900">Debit</div>
            <div className="text-xs text-slate-500">
              Assets and expenses normally open with a debit balance.
            </div>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-100">
            <ArrowUpRight size={16} className="text-rose-600" />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-900">Credit</div>
            <div className="text-xs text-slate-500">
              Liabilities, equity and income normally open with a credit balance.
            </div>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100">
            <Scale size={16} className="text-blue-600" />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-900">Balanced total</div>
            <div className="text-xs text-slate-500">
              Across all entries, total debit should equal total credit.
            </div>
          </div>
        </div>
      </div>

      <p className="mt-4 text-xs text-slate-500">
        Only one side can carry a value per entry — filling one clears the other.
      </p>
    </div>
  );
}
