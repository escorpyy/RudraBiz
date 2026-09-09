import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Plus, MapPinned } from "lucide-react";
import { prisma } from "@/lib/prisma";
import StatusBadge from "@/components/account-groups/StatusBadge";
import DetailActions from "@/components/shared/DetailActions";

export const dynamic = "force-dynamic";

export default async function ViewAreaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const area = await prisma.area.findUnique({
    where: { id: Number(id) },
    include: {
      subAreas: {
        orderBy: { code: "asc" },
        include: { _count: { select: { generalLedgers: true, parties: true } } },
      },
    },
  });
  if (!area) notFound();

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">{area.name}</h1>
            <StatusBadge status={area.isActive ? "ACTIVE" : "INACTIVE"} />
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-sm">
            <Link href="/master/areas" className="text-brand hover:underline">
              Area Master
            </Link>
            <span className="text-slate-400">&gt;</span>
            <span className="text-slate-500">{area.code}</span>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            href="/master/areas"
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft size={16} />
            Back
          </Link>
          <DetailActions
            editHref={`/master/areas/${area.id}/edit`}
            deleteUrl={`/api/areas/${area.id}`}
            redirectHref="/master/areas"
            entityName={area.name}
          />
        </div>
      </div>

      <div className="my-5 border-t border-slate-200" />

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
          <div className="text-sm text-slate-500">Area Code</div>
          <div className="mt-1 text-lg font-semibold text-slate-900">{area.code}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
          <div className="text-sm text-slate-500">Short Name</div>
          <div className="mt-1 text-lg font-semibold text-slate-900">{area.shortName}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
          <div className="text-sm text-slate-500">Sub-Areas</div>
          <div className="mt-1 text-lg font-semibold text-slate-900">{area.subAreas.length}</div>
        </div>
      </div>

      {/* Sub-areas belonging to this area */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-white shadow-card">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div className="flex items-center gap-2">
            <MapPinned size={16} className="text-blue-500" />
            <h2 className="text-base font-semibold text-slate-900">Sub-Areas in this Area</h2>
          </div>
          <Link
            href={`/master/areas/sub-areas/new?areaId=${area.id}`}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <Plus size={15} />
            New Sub-Area
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-medium uppercase tracking-wide text-slate-500">
                <th className="px-5 py-3 font-medium">Code</th>
                <th className="px-3 py-3 font-medium">Name</th>
                <th className="px-3 py-3 font-medium">Short Name</th>
                <th className="px-3 py-3 font-medium">Ledgers</th>
                <th className="px-3 py-3 font-medium">Parties</th>
                <th className="px-3 py-3 font-medium">Status</th>
                <th className="px-5 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {area.subAreas.map((sa) => (
                <tr key={sa.id} className="hover:bg-slate-50/60">
                  <td className="px-5 py-3.5 font-medium text-slate-900">{sa.code}</td>
                  <td className="px-3 py-3.5 text-slate-800">{sa.name}</td>
                  <td className="px-3 py-3.5 text-slate-500">{sa.shortName}</td>
                  <td className="px-3 py-3.5 text-slate-500">{sa._count.generalLedgers}</td>
                  <td className="px-3 py-3.5 text-slate-500">{sa._count.parties}</td>
                  <td className="px-3 py-3.5">
                    <StatusBadge status={sa.isActive ? "ACTIVE" : "INACTIVE"} />
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <Link
                      href={`/master/areas/sub-areas/${sa.id}`}
                      className="text-sm font-medium text-brand hover:underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
              {area.subAreas.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-sm text-slate-400">
                    No sub-areas in this area yet.
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
