import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Tags } from "lucide-react";
import { prisma } from "@/lib/prisma";
import StatusBadge from "@/components/account-groups/StatusBadge";
import DetailActions from "@/components/shared/DetailActions";

export const dynamic = "force-dynamic";

export default async function ViewProductGroupPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const group = await prisma.productGroup.findUnique({
    where: { id: Number(id) },
    include: { subGroups: { orderBy: { code: "asc" }, include: { _count: { select: { products: true } } } } },
  });
  if (!group) notFound();

  const totalProducts = group.subGroups.reduce((sum, sg) => sum + sg._count.products, 0);

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">{group.name}</h1>
            <StatusBadge status={group.isActive ? "ACTIVE" : "INACTIVE"} />
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-sm">
            <Link href="/master/product-groups" className="text-brand hover:underline">
              Product Group Master
            </Link>
            <span className="text-slate-400">&gt;</span>
            <span className="text-slate-500">{group.code}</span>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            href="/master/product-groups"
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft size={16} />
            Back
          </Link>
          <DetailActions
            editHref={`/master/product-groups/${group.id}/edit`}
            deleteUrl={`/api/product-groups/${group.id}`}
            redirectHref="/master/product-groups"
            entityName={group.name}
          />
        </div>
      </div>

      <div className="my-5 border-t border-slate-200" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
          <div className="text-sm text-slate-500">Group Code</div>
          <div className="mt-1 text-lg font-semibold text-slate-900">{group.code}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
          <div className="text-sm text-slate-500">Sub-Groups</div>
          <div className="mt-1 text-lg font-semibold text-slate-900">{group.subGroups.length}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
          <div className="text-sm text-slate-500">Products</div>
          <div className="mt-1 text-lg font-semibold text-slate-900">{totalProducts}</div>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white shadow-card">
        <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-4">
          <Tags size={16} className="text-blue-500" />
          <h2 className="text-base font-semibold text-slate-900">Sub-Groups in this Group</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-medium uppercase tracking-wide text-slate-500">
                <th className="px-5 py-3 font-medium">Code</th>
                <th className="px-3 py-3 font-medium">Name</th>
                <th className="px-3 py-3 font-medium">Products</th>
                <th className="px-3 py-3 font-medium">Status</th>
                <th className="px-5 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {group.subGroups.map((sg) => (
                <tr key={sg.id} className="hover:bg-slate-50/60">
                  <td className="px-5 py-3.5 font-medium text-slate-900">{sg.code}</td>
                  <td className="px-3 py-3.5 text-slate-800">{sg.name}</td>
                  <td className="px-3 py-3.5">
                    <span className="font-medium text-brand">{sg._count.products}</span>
                  </td>
                  <td className="px-3 py-3.5">
                    <StatusBadge status={sg.isActive ? "ACTIVE" : "INACTIVE"} />
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <Link href={`/master/product-sub-groups/${sg.id}`} className="text-sm font-medium text-brand hover:underline">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
              {group.subGroups.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-sm text-slate-400">
                    No sub-groups in this group yet.
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
