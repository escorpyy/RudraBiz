import { STATUS_STYLES, type RecordStatus } from "@/lib/constants";

export default function StatusBadge({ status }: { status: RecordStatus }) {
  const config = STATUS_STYLES[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium ${config.badge}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}
