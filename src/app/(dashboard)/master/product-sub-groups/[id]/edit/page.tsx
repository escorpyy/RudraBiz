import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import ProductSubGroupForm from "@/components/product-groups/ProductSubGroupForm";

export const dynamic = "force-dynamic";

export default async function EditProductSubGroupPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const subGroup = await prisma.productSubGroup.findUnique({ where: { id: Number(id) } });
  if (!subGroup) notFound();

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Edit Product Sub-Group</h1>
          <div className="mt-1 flex items-center gap-1.5 text-sm">
            <Link href="/master/product-sub-groups" className="text-brand hover:underline">
              Product Sub-Group Master
            </Link>
            <span className="text-slate-400">&gt;</span>
            <span className="text-slate-500">Edit {subGroup.code}</span>
          </div>
        </div>
        <Link
          href={`/master/product-sub-groups/${subGroup.id}`}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <ArrowLeft size={16} />
          Back to Sub-Group
        </Link>
      </div>

      <div className="my-5 border-t border-slate-200" />

      <div className="max-w-2xl">
        <ProductSubGroupForm
          initial={{
            id: subGroup.id,
            productGroupId: subGroup.productGroupId,
            code: subGroup.code,
            name: subGroup.name,
            status: subGroup.isActive ? "ACTIVE" : "INACTIVE",
          }}
        />
      </div>
    </div>
  );
}
