import { Scale, CheckCircle2, AlertTriangle } from "lucide-react";

/**
 * Debit/Credit balance strip — "Total Debit | Total Credit | Difference",
 * green when balanced, amber when not.
 *
 * Built for Opening Balance Master (a company's opening trial balance has
 * to balance), but deliberately generic: Journal Voucher and Cash/Bank
 * Voucher entry need exactly this strip while lines are being typed, which
 * is why it lives in `shared/` rather than the opening-balances folder.
 *
 * Amounts are accepted as `number` after the caller has converted them from
 * Prisma `Decimal`, since this is a presentational component.
 */
export default function BalanceIndicator({
  totalDebit,
  totalCredit,
  currency = "NPR",
  label = "Opening Trial Balance",
}: {
  totalDebit: number;
  totalCredit: number;
  currency?: string;
  label?: string;
}) {
  const difference = totalDebit - totalCredit;
  // Opening balances are Decimal(18,6) in the database, so compare with a
  // tolerance rather than `=== 0` to avoid float noise flagging a set of
  // rows that actually balances to the sixth decimal place.
  const isBalanced = Math.abs(difference) < 0.000001;

  function fmt(value: number) {
    return value.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  return (
    <div
      className={`flex flex-wrap items-center gap-x-8 gap-y-3 rounded-xl border p-5 shadow-card ${
        isBalanced ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"
      }`}
    >
      <div className="flex items-center gap-2.5">
        <Scale size={18} className={isBalanced ? "text-emerald-600" : "text-amber-600"} />
        <span className="text-sm font-semibold text-slate-800">{label}</span>
      </div>

      <div>
        <div className="text-xs text-slate-500">Total Debit</div>
        <div className="text-lg font-bold text-slate-900">
          {currency} {fmt(totalDebit)}
        </div>
      </div>

      <div>
        <div className="text-xs text-slate-500">Total Credit</div>
        <div className="text-lg font-bold text-slate-900">
          {currency} {fmt(totalCredit)}
        </div>
      </div>

      <div>
        <div className="text-xs text-slate-500">Difference</div>
        <div className={`text-lg font-bold ${isBalanced ? "text-emerald-700" : "text-amber-700"}`}>
          {currency} {fmt(Math.abs(difference))}
        </div>
      </div>

      <div className="ml-auto">
        {isBalanced ? (
          <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
            <CheckCircle2 size={13} />
            Balanced
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">
            <AlertTriangle size={13} />
            {difference > 0 ? "Debit exceeds credit" : "Credit exceeds debit"}
          </span>
        )}
      </div>
    </div>
  );
}
