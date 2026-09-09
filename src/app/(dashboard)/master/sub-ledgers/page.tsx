import Link from "next/link";
import { Plus, Layers, CheckCircle2, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import StatCard from "@/components/account-groups/StatCard";
import SubLedgersTable, { type SubLedgerRow } from "@/components/sub-ledgers/SubLedgersTable";

export const dynamic = "force-dynamic";

export default async function SubLedgersPage() {
  const subLedgers = await prisma.subLedger.findMany({
    orderBy: { code: "asc" },
    include: { generalLedger: true, party: { include: { generalLedger: true } } },
  });

  const rows: SubLedgerRow[] = subLedgers.map((s) => ({
    id: s.id,
    code: s.code,
    name: s.name,
    generalLedgerId: s.generalLedgerId,
    generalLedgerName: s.generalLedger?.name ?? null,
    partyName: s.party?.generalLedger.name ?? null,
    isActive: s.isActive,
  }));

  const generalLedgerOptions = Array.from(
    new Map(
      rows
        .filter((r) => r.generalLedgerId !== null && r.generalLedgerName !== null)
        .map((r) => [r.generalLedgerId, { id: r.generalLedgerId as number, name: r.generalLedgerName as string }])
    ).values()
  );

  const activeCount = rows.filter((r) => r.isActive).length;
  const linkedToPartyCount = rows.filter((r) => r.partyName).length;

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Sub-Ledger Master</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage sub-ledgers — finer-grained accounts nested under a general ledger or party
          </p>
        </div>
        <Link
          href="/master/sub-ledgers/new"
          className="flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-hover"
        >
          <Plus size={16} />
          New Sub-Ledger
        </Link>
      </div>

      {/* Stat cards */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          icon={Layers}
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
          label="Sub-Ledgers"
          value={rows.length}
          caption="Total sub-ledgers"
        />
        <StatCard
          icon={CheckCircle2}
          iconBg="bg-emerald-100"
          iconColor="text-emerald-600"
          label="Active"
          value={activeCount}
          caption="Available for posting"
        />
        <StatCard
          icon={Users}
          iconBg="bg-violet-100"
          iconColor="text-violet-600"
          label="Linked to Party"
          value={linkedToPartyCount}
          caption="Tracking a customer/vendor"
        />
      </div>

      <div className="mt-6">
        <SubLedgersTable rows={rows} generalLedgerOptions={generalLedgerOptions} />
      </div>
    </div>
  );
}
