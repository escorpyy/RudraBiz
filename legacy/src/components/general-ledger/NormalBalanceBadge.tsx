import { NORMAL_BALANCES, type NormalBalance } from "@/lib/constants";

export default function NormalBalanceBadge({ value }: { value: NormalBalance }) {
  const config = NORMAL_BALANCES[value];
  return (
    <span
      className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium ${config.badge}`}
    >
      {config.label}
    </span>
  );
}
