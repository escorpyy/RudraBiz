import Link from "next/link";
import { Plus, BookOpen, Landmark, CheckCircle2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import StatCard from "@/components/account-groups/StatCard";
import GLTable, { type GeneralLedgerRow } from "@/components/general-ledger/GLTable";

export const dynamic = "force-dynamic";

export default async function LedgerMasterPage() {
  const ledgers = await prisma.generalLedger.findMany({
    orderBy: { code: "asc" },
    include: {
      accountSubGroup: true,
      parent: { select: { name: true } },
    },
  });

  const rows: GeneralLedgerRow[] = ledgers.map((l) => ({
    id: l.id,
    code: l.code,
    name: l.name,
    accountSubGroupName: l.accountSubGroup.name,
    normalBalance: l.normalBalance,
    glType: l.glType,
    parentName: l.parent?.name ?? null,
    isCashOrBank: l.isCashOrBank,
    isActive: l.isActive,
  }));

  const totalCashOrBank = rows.filter((r) => r.isCashOrBank).length;
  const totalActive = rows.filter((r) => r.isActive).length;

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Ledger Master</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage general ledger accounts used across journal and cash/bank vouchers
          </p>
        </div>
        <Link
          href="/master/ledgers/new"
          className="flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-hover"
        >
          <Plus size={16} />
          New Ledger
        </Link>
      </div>

      {/* Stat cards */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          icon={BookOpen}
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
          label="Ledgers"
          value={rows.length}
          caption="Total general ledgers"
        />
        <StatCard
          icon={Landmark}
          iconBg="bg-emerald-100"
          iconColor="text-emerald-600"
          label="Cash / Bank"
          value={totalCashOrBank}
          caption="Cash or bank accounts"
        />
        <StatCard
          icon={CheckCircle2}
          iconBg="bg-amber-100"
          iconColor="text-amber-600"
          label="Active"
          value={totalActive}
          caption="Active ledgers"
        />
      </div>

      <div className="mt-6">
        <GLTable rows={rows} />
      </div>
    </div>
  );
}
