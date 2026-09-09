import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Plus, BookOpen, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import StatusBadge from "@/components/account-groups/StatusBadge";
import DetailActions from "@/components/shared/DetailActions";

export const dynamic = "force-dynamic";

export default async function ViewSubAreaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const subArea = await prisma.subArea.findUnique({
    where: { id: Number(id) },
    include: {
      area: true,
      generalLedgers: { orderBy: { code: "asc" } },
      parties: { include: { generalLedger: true }, orderBy: { id: "asc" } },
    },
  });
  if (!subArea) notFound();

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">{subArea.name}</h1>
            <StatusBadge status={subArea.isActive ? "ACTIVE" : "INACTIVE"} />
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-sm">
            <Link href="/master/areas/sub-areas" className="text-brand hover:underline">
              Sub-Areas
            </Link>
            <span className="text-slate-400">&gt;</span>
            <span className="text-slate-500">{subArea.code}</span>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            href="/master/areas/sub-areas"
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft size={16} />
            Back
          </Link>
          <DetailActions
            editHref={`/master/areas/sub-areas/${subArea.id}/edit`}
            deleteUrl={`/api/sub-areas/${subArea.id}`}
            redirectHref="/master/areas/sub-areas"
            entityName={subArea.name}
          />
        </div>
      </div>

      <div className="my-5 border-t border-slate-200" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
          <div className="text-sm text-slate-500">Sub-Area Code</div>
          <div className="mt-1 text-lg font-semibold text-slate-900">{subArea.code}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
          <div className="text-sm text-slate-500">Short Name</div>
          <div className="mt-1 text-lg font-semibold text-slate-900">{subArea.shortName}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
          <div className="text-sm text-slate-500">Area</div>
          <Link
            href={`/master/areas/${subArea.area.id}`}
            className="mt-1 block text-lg font-semibold text-brand hover:underline"
          >
            {subArea.area.name}
          </Link>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
          <div className="text-sm text-slate-500">Ledgers / Parties</div>
          <div className="mt-1 text-lg font-semibold text-slate-900">
            {subArea.generalLedgers.length} / {subArea.parties.length}
          </div>
        </div>
      </div>

      {/* Ledgers tagged to this sub-area */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-white shadow-card">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div className="flex items-center gap-2">
            <BookOpen size={16} className="text-amber-500" />
            <h2 className="text-base font-semibold text-slate-900">Ledgers in this Sub-Area</h2>
          </div>
          <Link
            href={`/master/ledgers/new?subAreaId=${subArea.id}`}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <Plus size={15} />
            New Ledger
          </Link>
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
              {subArea.generalLedgers.map((l) => (
                <tr key={l.id} className="hover:bg-slate-50/60">
                  <td className="px-5 py-3.5 font-medium text-slate-900">{l.code}</td>
                  <td className="px-3 py-3.5 text-slate-800">{l.name}</td>
                  <td className="px-3 py-3.5">
                    <StatusBadge status={l.isActive ? "ACTIVE" : "INACTIVE"} />
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <Link href={`/master/ledgers/${l.id}`} className="text-sm font-medium text-brand hover:underline">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
              {subArea.generalLedgers.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-sm text-slate-400">
                    No ledgers tagged to this sub-area yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Parties tagged to this sub-area */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-white shadow-card">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-emerald-500" />
            <h2 className="text-base font-semibold text-slate-900">Parties in this Sub-Area</h2>
          </div>
          <Link
            href={`/master/parties/new?subAreaId=${subArea.id}`}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <Plus size={15} />
            New Party
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-medium uppercase tracking-wide text-slate-500">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-3 py-3 font-medium">City</th>
                <th className="px-5 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {subArea.parties.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/60">
                  <td className="px-5 py-3.5 font-medium text-slate-900">{p.generalLedger.name}</td>
                  <td className="px-3 py-3.5 text-slate-800">{p.city ?? "—"}</td>
                  <td className="px-5 py-3.5 text-right">
                    <Link href={`/master/parties/${p.id}`} className="text-sm font-medium text-brand hover:underline">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
              {subArea.parties.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-5 py-10 text-center text-sm text-slate-400">
                    No parties tagged to this sub-area yet.
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
