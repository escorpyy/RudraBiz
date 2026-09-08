import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Plus, Layers } from "lucide-react";
import { prisma } from "@/lib/prisma";
import AccountTypeBadge from "@/components/account-groups/AccountTypeBadge";
import StatusBadge from "@/components/account-groups/StatusBadge";
import DetailActions from "@/components/shared/DetailActions";

export const dynamic = "force-dynamic";

export default async function ViewAccountGroupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const group = await prisma.accountGroup.findUnique({
    where: { id: Number(id) },
    include: {
      subGroups: {
        orderBy: { code: "asc" },
        include: { _count: { select: { generalLedgers: true } } },
      },
    },
  });
  if (!group) notFound();

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">{group.description}</h1>
            <AccountTypeBadge type={group.type} />
            <StatusBadge status={group.isActive ? "ACTIVE" : "INACTIVE"} />
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-sm">
            <Link href="/account-groups" className="text-brand hover:underline">
              Account Groups
            </Link>
            <span className="text-slate-400">&gt;</span>
            <span className="text-slate-500">{group.code}</span>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            href="/account-groups"
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft size={16} />
            Back
          </Link>
          <DetailActions
            editHref={`/account-groups/${group.id}/edit`}
            deleteUrl={`/api/account-groups/${group.id}`}
            redirectHref="/account-groups"
            entityName={group.description}
          />
        </div>
      </div>

      <div className="my-5 border-t border-slate-200" />

      {/* Group Code card */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
          <div className="text-sm text-slate-500">Group Code</div>
          <div className="mt-1 text-lg font-semibold text-slate-900">{group.code}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
          <div className="text-sm text-slate-500">Account Type</div>
          <div className="mt-1 text-lg font-semibold text-slate-900">{group.type}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
          <div className="text-sm text-slate-500">Sub-Groups</div>
          <div className="mt-1 text-lg font-semibold text-slate-900">{group.subGroups.length}</div>
        </div>
      </div>

      {/* Sub-groups belonging to this group */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-white shadow-card">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div className="flex items-center gap-2">
            <Layers size={16} className="text-blue-500" />
            <h2 className="text-base font-semibold text-slate-900">Sub-Groups in this Group</h2>
          </div>
          <Link
            href={`/sub-groups/new?accountGroupId=${group.id}`}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <Plus size={15} />
            New Sub-Group
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-medium uppercase tracking-wide text-slate-500">
                <th className="px-5 py-3 font-medium">Code</th>
                <th className="px-3 py-3 font-medium">Name</th>
                <th className="px-3 py-3 font-medium">Ledgers</th>
                <th className="px-3 py-3 font-medium">Status</th>
                <th className="px-5 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {group.subGroups.map((sg) => (
                <tr key={sg.id} className="hover:bg-slate-50/60">
                  <td className="px-5 py-3.5 font-medium text-slate-900">{sg.code}</td>
                  <td className="px-3 py-3.5 text-slate-800">{sg.description}</td>
                  <td className="px-3 py-3.5 text-slate-500">{sg._count.generalLedgers}</td>
                  <td className="px-3 py-3.5">
                    <StatusBadge status={sg.isActive ? "ACTIVE" : "INACTIVE"} />
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <Link href={`/sub-groups/${sg.id}`} className="text-sm font-medium text-brand hover:underline">
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
