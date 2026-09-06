import { ACCOUNT_TYPES, type AccountType } from "@/lib/constants";

export default function AccountTypeBadge({ type }: { type: AccountType }) {
  const config = ACCOUNT_TYPES[type];
  return (
    <span
      className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium ${config.badge}`}
    >
      {config.label}
    </span>
  );
}
