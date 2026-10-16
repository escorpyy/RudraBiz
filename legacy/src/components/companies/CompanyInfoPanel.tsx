import { Info, MapPin, CalendarRange, Users } from "lucide-react";

export default function CompanyInfoPanel() {
  return (
    <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-5">
      <div className="flex items-start gap-2.5">
        <Info size={18} className="mt-0.5 shrink-0 text-blue-600" />
        <div>
          <div className="font-semibold text-blue-700">About Companies</div>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
            A company is a separate accounting tenant — its own chart of
            accounts, parties, products and fiscal years. Everything you enter
            elsewhere in the app is scoped to whichever company is selected in
            the header switcher.
          </p>
        </div>
      </div>

      <div className="my-5 border-t border-blue-100" />

      <div className="text-sm font-semibold text-slate-900">What Comes With It</div>

      <div className="mt-4 space-y-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100">
            <MapPin size={16} className="text-blue-600" />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-900">Head Office branch</div>
            <div className="text-xs text-slate-500">Created automatically — every posting needs a branch.</div>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-100">
            <CalendarRange size={16} className="text-violet-600" />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-900">Fiscal years</div>
            <div className="text-xs text-slate-500">
              Set up separately under Fiscal Year, once this company exists.
            </div>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100">
            <Users size={16} className="text-emerald-600" />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-900">User access</div>
            <div className="text-xs text-slate-500">Who can see and switch into this company.</div>
          </div>
        </div>
      </div>

      <p className="mt-4 text-xs text-slate-500">
        A company can&apos;t be deleted once it holds any accounting data — deactivate it instead.
      </p>
    </div>
  );
}
