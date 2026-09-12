import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Boxes } from "lucide-react";
import { prisma } from "@/lib/prisma";
import StatusBadge from "@/components/account-groups/StatusBadge";
import ProductTypeBadge from "@/components/products/ProductTypeBadge";
import DetailActions from "@/components/shared/DetailActions";
import type { ProductType } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function ViewProductSubGroupPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const subGroup = await prisma.productSubGroup.findUnique({
    where: { id: Number(id) },
    include: {
      productGroup: true,
      products: { orderBy: { code: "asc" } },
    },
  });
  if (!subGroup) notFound();

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">{subGroup.name}</h1>
            <StatusBadge status={subGroup.isActive ? "ACTIVE" : "INACTIVE"} />
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-sm">
            <Link href="/master/product-sub-groups" className="text-brand hover:underline">
              Product Sub-Group Master
            </Link>
            <span className="text-slate-400">&gt;</span>
            <span className="text-slate-500">{subGroup.code}</span>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            href="/master/product-sub-groups"
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft size={16} />
            Back
          </Link>
          <DetailActions
            editHref={`/master/product-sub-groups/${subGroup.id}/edit`}
            deleteUrl={`/api/product-sub-groups/${subGroup.id}`}
            redirectHref="/master/product-sub-groups"
            entityName={subGroup.name}
          />
        </div>
      </div>

      <div className="my-5 border-t border-slate-200" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
          <div className="text-sm text-slate-500">Sub-Group Code</div>
          <div className="mt-1 text-lg font-semibold text-slate-900">{subGroup.code}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
          <div className="text-sm text-slate-500">Product Group</div>
          <div className="mt-1 text-lg font-semibold text-slate-900">{subGroup.productGroup.name}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
          <div className="text-sm text-slate-500">Products</div>
          <div className="mt-1 text-lg font-semibold text-slate-900">{subGroup.products.length}</div>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white shadow-card">
        <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-4">
          <Boxes size={16} className="text-blue-500" />
          <h2 className="text-base font-semibold text-slate-900">Products in this Sub-Group</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-medium uppercase tracking-wide text-slate-500">
                <th className="px-5 py-3 font-medium">Code</th>
                <th className="px-3 py-3 font-medium">Description</th>
                <th className="px-3 py-3 font-medium">Type</th>
                <th className="px-3 py-3 font-medium">Status</th>
                <th className="px-5 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {subGroup.products.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/60">
                  <td className="px-5 py-3.5 font-medium text-slate-900">{p.code}</td>
                  <td className="px-3 py-3.5 text-slate-800">{p.description}</td>
                  <td className="px-3 py-3.5">
                    <ProductTypeBadge type={p.type as ProductType} />
                  </td>
                  <td className="px-3 py-3.5">
                    <StatusBadge status={p.isActive ? "ACTIVE" : "INACTIVE"} />
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <Link href={`/master/products/${p.id}`} className="text-sm font-medium text-brand hover:underline">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
              {subGroup.products.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-sm text-slate-400">
                    No products in this sub-group yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
