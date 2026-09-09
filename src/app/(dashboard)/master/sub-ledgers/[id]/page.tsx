import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BookOpen, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import StatusBadge from "@/components/account-groups/StatusBadge";
import DetailActions from "@/components/shared/DetailActions";

export const dynamic = "force-dynamic";

export default async function ViewSubLedgerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const subLedger = await prisma.subLedger.findUnique({
    where: { id: Number(id) },
    include: { generalLedger: true, party: { include: { generalLedger: true } } },
  });
  if (!subLedger) notFound();

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">{subLedger.name}</h1>
            <StatusBadge status={subLedger.isActive ? "ACTIVE" : "INACTIVE"} />
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-sm">
            <Link href="/master/sub-ledgers" className="text-brand hover:underline">
              Sub-Ledger Master
            </Link>
            <span className="text-slate-400">&gt;</span>
            <span className="text-slate-500">{subLedger.code}</span>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            href="/master/sub-ledgers"
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft size={16} />
            Back
          </Link>
          <DetailActions
            editHref={`/master/sub-ledgers/${subLedger.id}/edit`}
            deleteUrl={`/api/sub-ledgers/${subLedger.id}`}
            redirectHref="/master/sub-ledgers"
            entityName={subLedger.name}
          />
        </div>
      </div>

      <div className="my-5 border-t border-slate-200" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
          <div className="text-sm text-slate-500">Sub-Ledger Code</div>
          <div className="mt-1 text-lg font-semibold text-slate-900">{subLedger.code}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
          <div className="text-sm text-slate-500">General Ledger</div>
          {subLedger.generalLedger ? (
            <Link
              href={`/master/ledgers/${subLedger.generalLedger.id}`}
              className="mt-1 flex items-center gap-1.5 text-lg font-semibold text-brand hover:underline"
            >
              <BookOpen size={16} />
              {subLedger.generalLedger.name}
            </Link>
          ) : (
            <div className="mt-1 text-lg font-semibold text-slate-400">— (none)</div>
          )}
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
          <div className="text-sm text-slate-500">Party</div>
          {subLedger.party ? (
            <div className="mt-1 flex items-center gap-1.5 text-lg font-semibold text-slate-900">
              <Users size={16} className="text-violet-600" />
              {subLedger.party.generalLedger.name}
            </div>
          ) : (
            <div className="mt-1 text-lg font-semibold text-slate-400">— (none)</div>
          )}
        </div>
      </div>
    </div>
  );
}
