import { Info } from "lucide-react";
import { HIERARCHY_STEPS } from "@/lib/constants";

export default function InfoPanel() {
  return (
    <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-5">
      <div className="flex items-start gap-2.5">
        <Info size={18} className="mt-0.5 shrink-0 text-blue-600" />
        <div>
          <div className="font-semibold text-blue-700">About Account Groups</div>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
            Account Groups are categories under an Account Type. Each group can have
            multiple sub-groups, and each sub-group can have multiple ledgers (actual
            accounts).
          </p>
        </div>
      </div>

      <div className="my-5 border-t border-blue-100" />

      <div className="text-sm font-semibold text-slate-900">Hierarchy Example</div>

      <div className="mt-4 space-y-0">
        {HIERARCHY_STEPS.map((step, i) => {
          const Icon = step.icon;
          const isLast = i === HIERARCHY_STEPS.length - 1;
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
    </div>
  );
}
