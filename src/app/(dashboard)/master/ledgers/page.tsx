import Link from "next/link";
import { Plus, BookOpen, Landmark, CheckCircle2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import StatCard from "@/components/account-groups/StatCard";
import GLTable, { type GeneralLedgerRow } from "@/components/general-ledger/GLTable";

export const dynamic = "force-dynamic";

export default async function LedgersPage() {
  const ledgers = await prisma.generalLedger.findMany({
    orderBy: { code: "asc" },
    include: { accountSubGroup: { include: { accountGroup: true } }, parent: true },
  });

  const rows: GeneralLedgerRow[] = ledgers.map((l) => ({
    id: l.id,
    code: l.code,
    name: l.name,
    glType: l.glType,
    accountGroupName: l.accountSubGroup.accountGroup.description,
    accountSubGroupName: l.accountSubGroup.description,
    isCashOrBank: l.isCashOrBank,
    postsToCashBook: l.postsToCashBook,
    requiresSubLedger: l.requiresSubLedger,
    allowDocAdjust: l.allowDocAdjust,
    isActive: l.isActive,
    parentName: l.parent?.name ?? null,
  }));

  const activeCount = rows.filter((r) => r.isActive).length;
  const cashBankCount = rows.filter((r) => r.isCashOrBank).length;

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Ledger Master</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage general ledgers — the accounts posted to by vouchers
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
          icon={CheckCircle2}
          iconBg="bg-emerald-100"
          iconColor="text-emerald-600"
          label="Active"
          value={activeCount}
          caption="Available for posting"
        />
        <StatCard
          icon={Landmark}
          iconBg="bg-amber-100"
          iconColor="text-amber-600"
          label="Cash / Bank"
          value={cashBankCount}
          caption="Cash or bank ledgers"
        />
      </div>

      <div className="mt-6">
        <GLTable rows={rows} />
      </div>
    </div>
  );
}
