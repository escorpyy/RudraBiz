import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BookOpen, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import StatusBadge from "@/components/account-groups/StatusBadge";
import DetailActions from "@/components/shared/DetailActions";

export const dynamic = "force-dynamic";

export default async function ViewAgentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const agent = await prisma.agent.findUnique({
    where: { id: Number(id) },
    include: {
      generalLedgers: {
        orderBy: { code: "asc" },
        select: { id: true, code: true, name: true, isActive: true },
      },
      parties: {
        orderBy: { id: "asc" },
        select: {
          id: true,
          generalLedger: { select: { code: true, name: true } },
        },
      },
      _count: { select: { generalLedgers: true, parties: true } },
    },
  });
  if (!agent) notFound();

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">{agent.name}</h1>
            <StatusBadge status={agent.isActive ? "ACTIVE" : "INACTIVE"} />
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-sm">
            <Link href="/master/agents" className="text-brand hover:underline">
              Agent Master
            </Link>
            <span className="text-slate-400">&gt;</span>
            <span className="text-slate-500">{agent.code}</span>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            href="/master/agents"
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft size={16} />
            Back
          </Link>
          <DetailActions
            editHref={`/master/agents/${agent.id}/edit`}
            deleteUrl={`/api/agents/${agent.id}`}
            redirectHref="/master/agents"
            entityName={agent.name}
          />
        </div>
      </div>

      <div className="my-5 border-t border-slate-200" />

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
          <div className="text-sm text-slate-500">Agent Code</div>
          <div className="mt-1 text-lg font-semibold text-slate-900">{agent.code}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
          <div className="text-sm text-slate-500">Phone</div>
          <div className="mt-1 text-lg font-semibold text-slate-900">{agent.phone || "—"}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
          <div className="text-sm text-slate-500">Ledgers / Parties Tagged</div>
          <div className="mt-1 text-lg font-semibold text-slate-900">
            {agent._count.generalLedgers} / {agent._count.parties}
          </div>
        </div>
      </div>

      {/* Ledgers tagged to this agent */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-white shadow-card">
        <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-4">
          <BookOpen size={16} className="text-blue-500" />
          <h2 className="text-base font-semibold text-slate-900">Ledgers Tagged to this Agent</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-medium uppercase tracking-wide text-slate-500">
                <th className="px-5 py-3 font-medium">Code</th>
                <th className="px-3 py-3 font-medium">Name</th>
                <th className="px-3 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {agent.generalLedgers.map((gl) => (
                <tr key={gl.id} className="hover:bg-slate-50/60">
                  <td className="px-5 py-3.5 font-medium text-slate-900">{gl.code}</td>
                  <td className="px-3 py-3.5 text-slate-800">{gl.name}</td>
                  <td className="px-3 py-3.5">
                    <StatusBadge status={gl.isActive ? "ACTIVE" : "INACTIVE"} />
                  </td>
                </tr>
              ))}
              {agent.generalLedgers.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-5 py-10 text-center text-sm text-slate-400">
                    No ledgers tagged to this agent yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Parties tagged to this agent */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-white shadow-card">
        <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-4">
          <Users size={16} className="text-violet-500" />
          <h2 className="text-base font-semibold text-slate-900">Parties Tagged to this Agent</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-medium uppercase tracking-wide text-slate-500">
                <th className="px-5 py-3 font-medium">Code</th>
                <th className="px-3 py-3 font-medium">Name</th>
                <th className="px-5 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {agent.parties.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/60">
                  <td className="px-5 py-3.5 font-medium text-slate-900">{p.generalLedger.code}</td>
                  <td className="px-3 py-3.5 text-slate-800">{p.generalLedger.name}</td>
                  <td className="px-5 py-3.5 text-right">
                    <Link
                      href={`/master/parties/${p.id}`}
                      className="text-sm font-medium text-brand hover:underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
              {agent.parties.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-5 py-10 text-center text-sm text-slate-400">
                    No parties tagged to this agent yet.
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
