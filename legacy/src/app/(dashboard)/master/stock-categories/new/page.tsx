import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import StockCategoryForm from "@/components/stock-categories/StockCategoryForm";

export const dynamic = "force-dynamic";

export default function NewStockCategoryPage() {
  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Add New Stock Category</h1>
          <div className="mt-1 flex items-center gap-1.5 text-sm">
            <Link href="/master/stock-categories" className="text-brand hover:underline">
              Stock Category Master
            </Link>
            <span className="text-slate-400">&gt;</span>
            <span className="text-slate-500">Add New Category</span>
          </div>
        </div>
        <Link
          href="/master/stock-categories"
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <ArrowLeft size={16} />
          Back to Categories
        </Link>
      </div>

      <div className="my-5 border-t border-slate-200" />

      <div className="max-w-2xl">
        <StockCategoryForm />
      </div>
    </div>
  );
}
