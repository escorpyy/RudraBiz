import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Landmark, Wallet, Users, FileEdit } from "lucide-react";
import { prisma } from "@/lib/prisma";
import GLTypeBadge from "@/components/general-ledger/GLTypeBadge";
import StatusBadge from "@/components/account-groups/StatusBadge";
import DetailActions from "@/components/shared/DetailActions";

export const dynamic = "force-dynamic";

const FLAGS = [
  { key: "isCashOrBank" as const, icon: Landmark, label: "Cash or Bank account" },
  { key: "postsToCashBook" as const, icon: Wallet, label: "Posts to Cash Book" },
  { key: "requiresSubLedger" as const, icon: Users, label: "Requires Sub-Ledger (party)" },
  { key: "allowDocAdjust" as const, icon: FileEdit, label: "Allow Document Adjustment" },
];

export default async function ViewLedgerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ledger = await prisma.generalLedger.findUnique({
    where: { id: Number(id) },
    include: {
      accountSubGroup: { include: { accountGroup: true } },
      parent: true,
      children: { orderBy: { code: "asc" } },
    },
  });
  if (!ledger) notFound();

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">{ledger.name}</h1>
            <GLTypeBadge type={ledger.glType} />
            <StatusBadge status={ledger.isActive ? "ACTIVE" : "INACTIVE"} />
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-sm">
            <Link href="/master/ledgers" className="text-brand hover:underline">
              Ledger Master
            </Link>
            <span className="text-slate-400">&gt;</span>
            <span className="text-slate-500">{ledger.code}</span>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            href="/master/ledgers"
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft size={16} />
            Back
          </Link>
          <DetailActions
            editHref={`/master/ledgers/${ledger.id}/edit`}
            deleteUrl={`/api/general-ledgers/${ledger.id}`}
            redirectHref="/master/ledgers"
            entityName={ledger.name}
          />
        </div>
      </div>

      <div className="my-5 border-t border-slate-200" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
          <div className="text-sm text-slate-500">GL Code</div>
          <div className="mt-1 text-lg font-semibold text-slate-900">{ledger.code}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
          <div className="text-sm text-slate-500">Account Group</div>
          <Link
            href={`/account-groups/${ledger.accountSubGroup.accountGroup.id}`}
            className="mt-1 block text-lg font-semibold text-brand hover:underline"
          >
            {ledger.accountSubGroup.accountGroup.description}
          </Link>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
          <div className="text-sm text-slate-500">Account Sub-Group</div>
          <Link
            href={`/sub-groups/${ledger.accountSubGroup.id}`}
            className="mt-1 block text-lg font-semibold text-brand hover:underline"
          >
            {ledger.accountSubGroup.description}
          </Link>
        </div>
      </div>

      {/* Posting Options */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-card">
        <div className="text-sm font-semibold text-slate-900">Posting Options</div>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {FLAGS.map((f) => {
            const Icon = f.icon;
            const on = ledger[f.key];
            return (
              <div
                key={f.key}
                className={`flex items-center gap-2.5 rounded-lg border px-3.5 py-2.5 text-sm ${
                  on ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 text-slate-400"
                }`}
              >
                <Icon size={15} />
                {f.label}
                <span className="ml-auto text-xs font-medium">{on ? "Yes" : "No"}</span>
              </div>
            );
          })}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
          <div>
            <div className="text-slate-500">Normal Balance</div>
            <div className="mt-0.5 font-medium text-slate-800">{ledger.normalBalance}</div>
          </div>
          <div>
            <div className="text-slate-500">Parent Ledger</div>
            <div className="mt-0.5 font-medium text-slate-800">
              {ledger.parent ? (
                <Link href={`/master/ledgers/${ledger.parent.id}`} className="text-brand hover:underline">
                  {ledger.parent.name}
                </Link>
              ) : (
                "— (top-level)"
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Nested (child) ledgers */}
      {ledger.children.length > 0 && (
        <div className="mt-6 rounded-xl border border-slate-200 bg-white shadow-card">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-base font-semibold text-slate-900">Ledgers Nested Under This One</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-medium uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-3 font-medium">Code</th>
                  <th className="px-3 py-3 font-medium">Name</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ledger.children.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/60">
                    <td className="px-5 py-3.5 font-medium text-slate-900">{c.code}</td>
                    <td className="px-3 py-3.5 text-slate-800">{c.name}</td>
                    <td className="px-3 py-3.5">
                      <StatusBadge status={c.isActive ? "ACTIVE" : "INACTIVE"} />
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link href={`/master/ledgers/${c.id}`} className="text-sm font-medium text-brand hover:underline">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
