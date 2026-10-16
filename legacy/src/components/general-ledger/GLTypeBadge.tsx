import { GL_TYPES, type GLType } from "@/lib/constants";

export default function GLTypeBadge({ type }: { type: GLType }) {
  const config = GL_TYPES[type];
  return (
    <span
      className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium ${config.badge}`}
    >
      {config.label}
    </span>
  );
}
