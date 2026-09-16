import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Building2, MapPin, Phone, Mail } from "lucide-react";
import { prisma } from "@/lib/prisma";
import StatusBadge from "@/components/account-groups/StatusBadge";
import DetailActions from "@/components/shared/DetailActions";

export const dynamic = "force-dynamic";

export default async function ViewBranchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const branch = await prisma.branch.findUnique({
    where: { id: Number(id) },
    include: {
      company: { select: { id: true, name: true, code: true } },
      _count: { select: { openingBalances: true, journalVouchers: true, cashBankVouchers: true } },
    },
  });
  if (!branch) notFound();

  const inUse = branch._count.openingBalances + branch._count.journalVouchers + branch._count.cashBankVouchers;

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">{branch.name}</h1>
            <StatusBadge status={branch.isActive ? "ACTIVE" : "INACTIVE"} />
            {branch.isHeadOffice && (
              <span className="inline-flex items-center rounded-md bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                Head Office
              </span>
            )}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-sm">
            <Link href="/setup/company" className="text-brand hover:underline">
              Company
            </Link>
            <span className="text-slate-400">&gt;</span>
            <Link href={`/setup/company/${branch.company.id}`} className="text-brand hover:underline">
              {branch.company.name}
            </Link>
            <span className="text-slate-400">&gt;</span>
            <span className="text-slate-500">{branch.code}</span>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            href={`/setup/company/${branch.company.id}`}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft size={16} />
            Back to Company
          </Link>
          <DetailActions
            editHref={`/setup/company/branches/${branch.id}/edit`}
            deleteUrl={`/api/branches/${branch.id}`}
            redirectHref={`/setup/company/${branch.company.id}`}
            entityName={branch.name}
          />
        </div>
      </div>

      <div className="my-5 border-t border-slate-200" />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card">
          <h2 className="text-base font-semibold text-slate-900">Details</h2>
          <div className="my-4 border-t border-slate-200" />
          <dl className="space-y-4 text-sm">
            <div className="flex items-start gap-3">
              <Building2 size={16} className="mt-0.5 shrink-0 text-blue-600" />
              <div>
                <dt className="text-xs text-slate-500">Company</dt>
                <dd className="text-slate-800">
                  {branch.company.code} — {branch.company.name}
                </dd>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin size={16} className="mt-0.5 shrink-0 text-blue-600" />
              <div>
                <dt className="text-xs text-slate-500">Address</dt>
                <dd className="text-slate-800">{branch.address ?? "—"}</dd>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Phone size={16} className="mt-0.5 shrink-0 text-slate-400" />
                <div>
                  <dt className="text-xs text-slate-500">Phone</dt>
                  <dd className="text-slate-800">{branch.phone ?? "—"}</dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail size={16} className="mt-0.5 shrink-0 text-slate-400" />
                <div>
                  <dt className="text-xs text-slate-500">Email</dt>
                  <dd className="text-slate-800">{branch.email ?? "—"}</dd>
                </div>
              </div>
            </div>
          </dl>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card">
          <h2 className="text-base font-semibold text-slate-900">Usage</h2>
          <div className="my-4 border-t border-slate-200" />
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-slate-900">{branch._count.openingBalances}</div>
              <div className="text-xs text-slate-500">Opening Balances</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{branch._count.journalVouchers}</div>
              <div className="text-xs text-slate-500">Journal Vouchers</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{branch._count.cashBankVouchers}</div>
              <div className="text-xs text-slate-500">Cash/Bank Vouchers</div>
            </div>
          </div>
          {inUse > 0 && (
            <p className="mt-4 text-xs text-slate-500">
              This branch can&apos;t be deleted while it has any of the records above — deactivate it instead.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
