import Link from "next/link";
import { Plus, IdCard, BookOpen, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import StatCard from "@/components/account-groups/StatCard";
import AgentsTable, { type AgentRow } from "@/components/agents/AgentsTable";

export const dynamic = "force-dynamic";

export default async function AgentsPage() {
  const agents = await prisma.agent.findMany({
    orderBy: { code: "asc" },
    include: {
      _count: { select: { generalLedgers: true, parties: true } },
    },
  });

  const rows: AgentRow[] = agents.map((a) => ({
    id: a.id,
    code: a.code,
    name: a.name,
    phone: a.phone,
    ledgersCount: a._count.generalLedgers,
    partiesCount: a._count.parties,
    status: a.isActive ? "ACTIVE" : "INACTIVE",
  }));

  const activeCount = rows.filter((r) => r.status === "ACTIVE").length;
  const totalLedgers = rows.reduce((sum, r) => sum + r.ledgersCount, 0);
  const totalParties = rows.reduce((sum, r) => sum + r.partiesCount, 0);

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Agent Master</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage agents/brokers used to tag ledgers, parties, and vouchers
          </p>
        </div>
        <Link
          href="/master/agents/new"
          className="flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-hover"
        >
          <Plus size={16} />
          New Agent
        </Link>
      </div>

      {/* Stat cards */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-4">
        <StatCard
          icon={IdCard}
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
          label="Agents"
          value={rows.length}
          caption="Total agents"
        />
        <StatCard
          icon={IdCard}
          iconBg="bg-emerald-100"
          iconColor="text-emerald-600"
          label="Active"
          value={activeCount}
          caption="Currently selectable"
        />
        <StatCard
          icon={BookOpen}
          iconBg="bg-amber-100"
          iconColor="text-amber-600"
          label="Ledgers"
          value={totalLedgers}
          caption="Ledgers tagged to an agent"
        />
        <StatCard
          icon={Users}
          iconBg="bg-violet-100"
          iconColor="text-violet-600"
          label="Parties"
          value={totalParties}
          caption="Parties tagged to an agent"
        />
      </div>

      <div className="mt-6">
        <AgentsTable rows={rows} />
      </div>
    </div>
  );
}
