import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Plus, BookOpen } from "lucide-react";
import { prisma } from "@/lib/prisma";
import StatusBadge from "@/components/account-groups/StatusBadge";
import DetailActions from "@/components/shared/DetailActions";

export const dynamic = "force-dynamic";

export default async function ViewSubGroupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const subGroup = await prisma.accountSubGroup.findUnique({
    where: { id: Number(id) },
    include: {
      accountGroup: true,
      generalLedgers: { orderBy: { code: "asc" } },
    },
  });
  if (!subGroup) notFound();

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">{subGroup.description}</h1>
            <StatusBadge status={subGroup.isActive ? "ACTIVE" : "INACTIVE"} />
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-sm">
            <Link href="/sub-groups" className="text-brand hover:underline">
              Sub-Groups
            </Link>
            <span className="text-slate-400">&gt;</span>
            <span className="text-slate-500">{subGroup.code}</span>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            href="/sub-groups"
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft size={16} />
            Back
          </Link>
          <DetailActions
            editHref={`/sub-groups/${subGroup.id}/edit`}
            deleteUrl={`/api/account-sub-groups/${subGroup.id}`}
            redirectHref="/sub-groups"
            entityName={subGroup.description}
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
          <div className="text-sm text-slate-500">Account Group</div>
          <Link
            href={`/account-groups/${subGroup.accountGroup.id}`}
            className="mt-1 block text-lg font-semibold text-brand hover:underline"
          >
            {subGroup.accountGroup.description}
          </Link>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
          <div className="text-sm text-slate-500">Ledgers</div>
          <div className="mt-1 text-lg font-semibold text-slate-900">{subGroup.generalLedgers.length}</div>
        </div>
      </div>

      {/* Ledgers under this sub-group */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-white shadow-card">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div className="flex items-center gap-2">
            <BookOpen size={16} className="text-amber-500" />
            <h2 className="text-base font-semibold text-slate-900">Ledgers in this Sub-Group</h2>
          </div>
          <Link
            href={`/master/ledgers/new?accountSubGroupId=${subGroup.id}`}
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
              {subGroup.generalLedgers.map((l) => (
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
              {subGroup.generalLedgers.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-sm text-slate-400">
                    No ledgers in this sub-group yet.
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
