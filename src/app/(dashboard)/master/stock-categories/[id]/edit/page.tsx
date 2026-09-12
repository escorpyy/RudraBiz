import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import StockCategoryForm from "@/components/stock-categories/StockCategoryForm";

export const dynamic = "force-dynamic";

export default async function EditStockCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const category = await prisma.stockCategory.findUnique({ where: { id: Number(id) } });
  if (!category) notFound();

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Edit Stock Category</h1>
          <div className="mt-1 flex items-center gap-1.5 text-sm">
            <Link href="/master/stock-categories" className="text-brand hover:underline">
              Stock Category Master
            </Link>
            <span className="text-slate-400">&gt;</span>
            <span className="text-slate-500">Edit {category.code}</span>
          </div>
        </div>
        <Link
          href={`/master/stock-categories/${category.id}`}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <ArrowLeft size={16} />
          Back to Category
        </Link>
      </div>

      <div className="my-5 border-t border-slate-200" />

      <div className="max-w-2xl">
        <StockCategoryForm
          initial={{
            id: category.id,
            code: category.code,
            name: category.name,
            status: category.isActive ? "ACTIVE" : "INACTIVE",
          }}
        />
      </div>
    </div>
  );
}
