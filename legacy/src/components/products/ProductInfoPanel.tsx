import { Info, Boxes, Wrench, Landmark, Layers } from "lucide-react";

export default function ProductInfoPanel() {
  return (
    <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-5">
      <div className="flex items-start gap-2.5">
        <Info size={18} className="mt-0.5 shrink-0 text-blue-600" />
        <div>
          <div className="font-semibold text-blue-700">About Products</div>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
            Every product has one Product Type, chosen once and fixed after
            creation — it decides which detail fields apply and can&apos;t be
            changed later since each type keeps its own detail record.
          </p>
        </div>
      </div>

      <div className="my-5 border-t border-blue-100" />

      <div className="text-sm font-semibold text-slate-900">Product Types</div>

      <div className="mt-4 space-y-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100">
            <Boxes size={16} className="text-blue-600" />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-900">Stock</div>
            <div className="text-xs text-slate-500">Quantity-tracked goods — units, valuation, reorder levels.</div>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-100">
            <Layers size={16} className="text-violet-600" />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-900">Non-Stock &amp; Service</div>
            <div className="text-xs text-slate-500">Buy/sell items or billable services — no quantity tracking.</div>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-100">
            <Landmark size={16} className="text-rose-600" />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-900">Fixed Asset</div>
            <div className="text-xs text-slate-500">Depreciable assets — needs three linked GL accounts.</div>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100">
            <Wrench size={16} className="text-emerald-600" />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-900">Bundle</div>
            <div className="text-xs text-slate-500">A set of other products sold together (no nested bundles).</div>
          </div>
        </div>
      </div>

      <p className="mt-4 text-xs text-slate-500">
        Deleting a product that&apos;s used as a bundle component elsewhere is
        blocked until it&apos;s removed from those bundles first.
      </p>
    </div>
  );
}
