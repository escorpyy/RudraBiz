import { Info, BookOpen, Users, CreditCard } from "lucide-react";

export default function PartyInfoPanel() {
  return (
    <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-5">
      <div className="flex items-start gap-2.5">
        <Info size={18} className="mt-0.5 shrink-0 text-blue-600" />
        <div>
          <div className="font-semibold text-blue-700">About Parties</div>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
            A Party is a customer or vendor. Creating one also creates its
            underlying General Ledger account, so it can be posted to directly
            from vouchers, invoices, and bills.
          </p>
        </div>
      </div>

      <div className="my-5 border-t border-blue-100" />

      <div className="text-sm font-semibold text-slate-900">What Gets Created</div>

      <div className="mt-4 space-y-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100">
            <BookOpen size={16} className="text-amber-600" />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-900">General Ledger</div>
            <div className="text-xs text-slate-500">The postable account behind this party.</div>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-100">
            <Users size={16} className="text-violet-600" />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-900">Party Profile</div>
            <div className="text-xs text-slate-500">Address, contact, PAN/VAT, area &amp; agent.</div>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100">
            <CreditCard size={16} className="text-emerald-600" />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-900">Credit / Payment Terms</div>
            <div className="text-xs text-slate-500">Shown based on the party type you pick.</div>
          </div>
        </div>
      </div>

      <p className="mt-4 text-xs text-slate-500">
        Deleting a party removes its profile only — the underlying ledger stays and can be managed from Ledger Master.
      </p>
    </div>
  );
}
