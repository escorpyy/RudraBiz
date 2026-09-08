import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import GLForm from "@/components/general-ledger/GLForm";
import GLInfoPanel from "@/components/general-ledger/GLInfoPanel";

export const dynamic = "force-dynamic";

export default async function EditLedgerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ledger = await prisma.generalLedger.findUnique({
    where: { id: Number(id) },
    include: { accountSubGroup: true },
  });
  if (!ledger) notFound();

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Edit General Ledger</h1>
          <div className="mt-1 flex items-center gap-1.5 text-sm">
            <Link href="/master/ledgers" className="text-brand hover:underline">
              Ledger Master
            </Link>
            <span className="text-slate-400">&gt;</span>
            <span className="text-slate-500">Edit {ledger.code}</span>
          </div>
        </div>
        <Link
          href={`/master/ledgers/${ledger.id}`}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <ArrowLeft size={16} />
          Back to Ledger
        </Link>
      </div>

      <div className="my-5 border-t border-slate-200" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
        <GLForm
          initial={{
            id: ledger.id,
            code: ledger.code,
            name: ledger.name,
            glType: ledger.glType,
            accountGroupId: ledger.accountSubGroup.accountGroupId,
            accountSubGroupId: ledger.accountSubGroupId,
            parentId: ledger.parentId,
            isCashOrBank: ledger.isCashOrBank,
            postsToCashBook: ledger.postsToCashBook,
            requiresSubLedger: ledger.requiresSubLedger,
            allowDocAdjust: ledger.allowDocAdjust,
            isActive: ledger.isActive,
          }}
        />
        <GLInfoPanel />
      </div>
    </div>
  );
}
