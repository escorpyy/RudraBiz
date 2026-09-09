import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import AgentForm from "@/components/agents/AgentForm";
import AgentInfoPanel from "@/components/agents/AgentInfoPanel";

export const dynamic = "force-dynamic";

export default async function EditAgentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const agent = await prisma.agent.findUnique({ where: { id: Number(id) } });
  if (!agent) notFound();

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Edit Agent</h1>
          <div className="mt-1 flex items-center gap-1.5 text-sm">
            <Link href="/master/agents" className="text-brand hover:underline">
              Agent Master
            </Link>
            <span className="text-slate-400">&gt;</span>
            <span className="text-slate-500">Edit {agent.code}</span>
          </div>
        </div>
        <Link
          href={`/master/agents/${agent.id}`}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <ArrowLeft size={16} />
          Back to Agent
        </Link>
      </div>

      <div className="my-5 border-t border-slate-200" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
        <AgentForm
          initial={{
            id: agent.id,
            code: agent.code,
            name: agent.name,
            phone: agent.phone,
            status: agent.isActive ? "ACTIVE" : "INACTIVE",
          }}
        />
        <AgentInfoPanel />
      </div>
    </div>
  );
}
