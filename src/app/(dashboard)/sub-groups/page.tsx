import Link from "next/link";
import { Plus, Network } from "lucide-react";
import { prisma } from "@/lib/prisma";
import StatCard from "@/components/account-groups/StatCard";
import SubGroupsTable, { type SubGroupRow } from "@/components/sub-groups/SubGroupsTable";

export const dynamic = "force-dynamic";

export default async function SubGroupsPage() {
  const subGroups = await prisma.accountSubGroup.findMany({
    orderBy: { code: "asc" },
    include: { accountGroup: true, _count: { select: { generalLedgers: true } } },
  });

  const rows: SubGroupRow[] = subGroups.map((sg) => ({
    id: sg.id,
    code: sg.code,
    name: sg.description,
    accountGroupId: sg.accountGroupId,
    accountGroupName: sg.accountGroup.description,
    ledgersCount: sg._count.generalLedgers,
    status: sg.isActive ? "ACTIVE" : "INACTIVE",
  }));

  const accountGroupOptions = Array.from(
    new Map(rows.map((r) => [r.accountGroupId, { id: r.accountGroupId, name: r.accountGroupName }])).values()
  );

  const activeCount = rows.filter((r) => r.status === "ACTIVE").length;
  const totalLedgers = rows.reduce((sum, r) => sum + r.ledgersCount, 0);

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Account Sub-Group Master</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage sub-groups that sit between account groups and general ledgers
          </p>
        </div>
        <Link
          href="/sub-groups/new"
          className="flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-hover"
        >
          <Plus size={16} />
          New Sub-Group
        </Link>
      </div>

      {/* Stat cards */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          icon={Network}
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
          label="Sub-Groups"
          value={rows.length}
          caption="Total sub-groups"
        />
        <StatCard
          icon={Network}
          iconBg="bg-emerald-100"
          iconColor="text-emerald-600"
          label="Active"
          value={activeCount}
          caption="Available for use"
        />
        <StatCard
          icon={Network}
          iconBg="bg-amber-100"
          iconColor="text-amber-600"
          label="Ledgers"
          value={totalLedgers}
          caption="Total ledgers across all sub-groups"
        />
      </div>

      <div className="mt-6">
        <SubGroupsTable rows={rows} accountGroupOptions={accountGroupOptions} />
      </div>
    </div>
  );
}
