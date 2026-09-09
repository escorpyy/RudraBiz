import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import SubLedgerForm from "@/components/sub-ledgers/SubLedgerForm";
import SubLedgerInfoPanel from "@/components/sub-ledgers/SubLedgerInfoPanel";

export const dynamic = "force-dynamic";

export default async function EditSubLedgerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const subLedger = await prisma.subLedger.findUnique({
    where: { id: Number(id) },
  });
  if (!subLedger) notFound();

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Edit Sub-Ledger</h1>
          <div className="mt-1 flex items-center gap-1.5 text-sm">
            <Link href="/master/sub-ledgers" className="text-brand hover:underline">
              Sub-Ledger Master
            </Link>
            <span className="text-slate-400">&gt;</span>
            <span className="text-slate-500">Edit {subLedger.code}</span>
          </div>
        </div>
        <Link
          href={`/master/sub-ledgers/${subLedger.id}`}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <ArrowLeft size={16} />
          Back to Sub-Ledger
        </Link>
      </div>

      <div className="my-5 border-t border-slate-200" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
        <SubLedgerForm
          initial={{
            id: subLedger.id,
            code: subLedger.code,
            name: subLedger.name,
            generalLedgerId: subLedger.generalLedgerId,
            partyId: subLedger.partyId,
            status: subLedger.isActive ? "ACTIVE" : "INACTIVE",
          }}
        />
        <SubLedgerInfoPanel />
      </div>
    </div>
  );
}
