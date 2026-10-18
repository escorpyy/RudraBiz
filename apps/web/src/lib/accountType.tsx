import type { AccountGroupRow } from "@ntcas/shared";

export type AccountType = AccountGroupRow["type"];

/** Display labels and colours for account types (the values themselves come from the shared enum). */
export const ACCOUNT_TYPE_STYLES: Record<AccountType, { label: string; badge: string }> = {
  ASSET: { label: "Asset", badge: "bg-blue-50 text-blue-700" },
  LIABILITY: { label: "Liability", badge: "bg-amber-50 text-amber-700" },
  EQUITY: { label: "Equity", badge: "bg-violet-50 text-violet-700" },
  REVENUE: { label: "Revenue", badge: "bg-emerald-50 text-emerald-700" },
  EXPENSE: { label: "Expense", badge: "bg-rose-50 text-rose-700" },
};

export const ACCOUNT_TYPE_OPTIONS = (Object.keys(ACCOUNT_TYPE_STYLES) as AccountType[]).map((t) => ({ value: t, label: ACCOUNT_TYPE_STYLES[t].label }));

export function AccountTypeBadge({ type }: { type: AccountType }) {
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${ACCOUNT_TYPE_STYLES[type].badge}`}>{ACCOUNT_TYPE_STYLES[type].label}</span>;
}
