import Link from "next/link";
import { Plus, Layers, Network, BookOpen } from "lucide-react";
import { prisma } from "@/lib/prisma";
import StatCard from "@/components/account-groups/StatCard";
import GroupsTable, { type AccountGroupRow } from "@/components/account-groups/GroupsTable";
import AboutBanner from "@/components/account-groups/AboutBanner";

export const dynamic = "force-dynamic";

export default async function AccountGroupsPage() {
  const groups = await prisma.accountGroup.findMany({
    orderBy: { code: "asc" },
    include: {
      subGroups: {
        include: { _count: { select: { generalLedgers: true } } },
      },
    },
  });

  const rows: AccountGroupRow[] = groups.map((g) => ({
    id: String(g.id),
    code: g.code,
    name: g.description,
    accountType: g.type,
    subGroupsCount: g.subGroups.length,
    ledgersCount: g.subGroups.reduce((sum, sg) => sum + sg._count.generalLedgers, 0),
    status: g.isActive ? "ACTIVE" : "INACTIVE",
  }));

  const totalSubGroups = rows.reduce((sum, r) => sum + r.subGroupsCount, 0);
  const totalLedgers = rows.reduce((sum, r) => sum + r.ledgersCount, 0);

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Account Groups</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage account groups, sub-groups and ledgers (chart of accounts)
          </p>
        </div>
        <Link
          href="/account-groups/new"
          className="flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-hover"
        >
          <Plus size={16} />
          New Group
        </Link>
      </div>

      {/* Stat cards */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          icon={Layers}
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
          label="Groups"
          value={rows.length}
          caption="Total groups"
        />
        <StatCard
          icon={Network}
          iconBg="bg-emerald-100"
          iconColor="text-emerald-600"
          label="Sub-Groups"
          value={totalSubGroups}
          caption="Total sub-groups"
        />
        <StatCard
          icon={BookOpen}
          iconBg="bg-amber-100"
          iconColor="text-amber-600"
          label="Ledgers"
          value={totalLedgers}
          caption="Total ledgers"
        />
      </div>

      <div className="mt-6">
        <GroupsTable rows={rows} />
      </div>

      <AboutBanner />
    </div>
  );
}
