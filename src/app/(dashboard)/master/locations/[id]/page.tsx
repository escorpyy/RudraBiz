import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPinned } from "lucide-react";
import { prisma } from "@/lib/prisma";
import StatusBadge from "@/components/account-groups/StatusBadge";
import DetailActions from "@/components/shared/DetailActions";

export const dynamic = "force-dynamic";

export default async function ViewLocationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const location = await prisma.location.findUnique({
    where: { id: Number(id) },
    include: {
      parent: true,
      children: { orderBy: { code: "asc" } },
      _count: { select: { stockDetails: true, fixedAssetDetails: true } },
    },
  });
  if (!location) notFound();

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">{location.name}</h1>
            <StatusBadge status={location.isActive ? "ACTIVE" : "INACTIVE"} />
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-sm">
            <Link href="/master/locations" className="text-brand hover:underline">
              Location Master
            </Link>
            <span className="text-slate-400">&gt;</span>
            <span className="text-slate-500">{location.code}</span>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            href="/master/locations"
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft size={16} />
            Back
          </Link>
          <DetailActions
            editHref={`/master/locations/${location.id}/edit`}
            deleteUrl={`/api/locations/${location.id}`}
            redirectHref="/master/locations"
            entityName={location.name}
          />
        </div>
      </div>

      <div className="my-5 border-t border-slate-200" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
          <div className="text-sm text-slate-500">Location Code</div>
          <div className="mt-1 text-lg font-semibold text-slate-900">{location.code}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
          <div className="text-sm text-slate-500">Parent Location</div>
          <div className="mt-1 text-lg font-semibold text-slate-900">{location.parent?.name ?? "—"}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
          <div className="text-sm text-slate-500">Products Using This Location</div>
          <div className="mt-1 text-lg font-semibold text-slate-900">
            {location._count.stockDetails + location._count.fixedAssetDetails}
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white shadow-card">
        <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-4">
          <MapPinned size={16} className="text-blue-500" />
          <h2 className="text-base font-semibold text-slate-900">Sub-Locations</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-medium uppercase tracking-wide text-slate-500">
                <th className="px-5 py-3 font-medium">Code</th>
                <th className="px-3 py-3 font-medium">Name</th>
                <th className="px-3 py-3 font-medium">Status</th>
                <th className="px-5 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {location.children.map((child) => (
                <tr key={child.id} className="hover:bg-slate-50/60">
                  <td className="px-5 py-3.5 font-medium text-slate-900">{child.code}</td>
                  <td className="px-3 py-3.5 text-slate-800">{child.name}</td>
                  <td className="px-3 py-3.5">
                    <StatusBadge status={child.isActive ? "ACTIVE" : "INACTIVE"} />
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <Link href={`/master/locations/${child.id}`} className="text-sm font-medium text-brand hover:underline">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
              {location.children.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-sm text-slate-400">
                    No sub-locations under this location yet.
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
