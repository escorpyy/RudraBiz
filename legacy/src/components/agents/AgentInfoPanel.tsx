import { Info, IdCard, BookOpen, Users } from "lucide-react";

const USAGE_STEPS = [
  {
    label: "Agent",
    example: "(e.g. Ram Kumar Sharma)",
    icon: IdCard,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
  },
  {
    label: "Ledger / Party",
    example: "(tagged against an agent)",
    icon: BookOpen,
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
  },
  {
    label: "Vouchers",
    example: "(journal & cash/bank lines)",
    icon: Users,
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
  },
];

export default function AgentInfoPanel() {
  return (
    <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-5">
      <div className="flex items-start gap-2.5">
        <Info size={18} className="mt-0.5 shrink-0 text-blue-600" />
        <div>
          <div className="font-semibold text-blue-700">About Agents</div>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
            Agents are the brokers/representatives that can be tagged against
            general ledgers, parties, and voucher lines to track who
            introduced or handles that business.
          </p>
        </div>
      </div>

      <div className="my-5 border-t border-blue-100" />

      <div className="text-sm font-semibold text-slate-900">Where Agents Are Used</div>

      <div className="mt-4 space-y-0">
        {USAGE_STEPS.map((step, i) => {
          const Icon = step.icon;
          const isLast = i === USAGE_STEPS.length - 1;
          return (
            <div key={step.label}>
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${step.iconBg}`}
                >
                  <Icon size={16} className={step.iconColor} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">{step.label}</div>
                  <div className="text-xs text-slate-500">{step.example}</div>
                </div>
              </div>
              {!isLast && <div className="ml-[17px] h-4 border-l border-dashed border-slate-300" />}
            </div>
          );
        })}
      </div>

      <div className="my-5 border-t border-blue-100" />

      <p className="text-xs leading-relaxed text-slate-500">
        Deactivating an agent removes it from selection on new records but
        keeps it tagged on existing ones. Deleting an agent unlinks it from
        anything it was tagged on.
      </p>
    </div>
  );
}
