import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, Mail, Phone, Smartphone, User, ShieldCheck, CreditCard, Truck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import GLTypeBadge from "@/components/general-ledger/GLTypeBadge";
import StatusBadge from "@/components/account-groups/StatusBadge";
import DetailActions from "@/components/shared/DetailActions";

export const dynamic = "force-dynamic";

export default async function ViewPartyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const party = await prisma.party.findUnique({
    where: { id: Number(id) },
    include: {
      generalLedger: { include: { accountSubGroup: { include: { accountGroup: true } } } },
      subArea: { include: { area: true } },
      agent: true,
      customerDetail: true,
      vendorDetail: true,
    },
  });
  if (!party) notFound();

  const contactRows = [
    { icon: MapPin, label: "Address", value: [party.address, party.city, party.state, party.country].filter(Boolean).join(", ") },
    { icon: Phone, label: "Phone", value: party.phone },
    { icon: Smartphone, label: "Mobile", value: party.mobile },
    { icon: Mail, label: "Email", value: party.email },
    { icon: User, label: "Contact Person", value: party.contactPerson },
  ].filter((r) => r.value);

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">{party.generalLedger.name}</h1>
            <GLTypeBadge type={party.generalLedger.glType} />
            <StatusBadge status={party.generalLedger.isActive ? "ACTIVE" : "INACTIVE"} />
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-sm">
            <Link href="/master/parties" className="text-brand hover:underline">
              Party Master
            </Link>
            <span className="text-slate-400">&gt;</span>
            <span className="text-slate-500">{party.generalLedger.code}</span>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            href="/master/parties"
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft size={16} />
            Back
          </Link>
          <DetailActions
            editHref={`/master/parties/${party.id}/edit`}
            deleteUrl={`/api/parties/${party.id}`}
            redirectHref="/master/parties"
            entityName={party.generalLedger.name}
          />
        </div>
      </div>

      <div className="my-5 border-t border-slate-200" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
          <div className="text-sm text-slate-500">Ledger Code</div>
          <div className="mt-1 text-lg font-semibold text-slate-900">{party.generalLedger.code}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
          <div className="text-sm text-slate-500">Account Group</div>
          <Link
            href={`/account-groups/${party.generalLedger.accountSubGroup.accountGroup.id}`}
            className="mt-1 block text-lg font-semibold text-brand hover:underline"
          >
            {party.generalLedger.accountSubGroup.accountGroup.description}
          </Link>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
          <div className="text-sm text-slate-500">Account Sub-Group</div>
          <Link
            href={`/sub-groups/${party.generalLedger.accountSubGroup.id}`}
            className="mt-1 block text-lg font-semibold text-brand hover:underline"
          >
            {party.generalLedger.accountSubGroup.description}
          </Link>
        </div>
      </div>

      {/* Contact Information */}
      {contactRows.length > 0 && (
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-card">
          <div className="text-sm font-semibold text-slate-900">Contact Information</div>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {contactRows.map((r) => {
              const Icon = r.icon;
              return (
                <div key={r.label} className="flex items-start gap-2.5 rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm">
                  <Icon size={15} className="mt-0.5 shrink-0 text-blue-500" />
                  <div>
                    <div className="text-xs text-slate-500">{r.label}</div>
                    <div className="text-slate-800">{r.value}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tax, Area, Agent */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
          <div className="flex items-center gap-1.5 text-sm text-slate-500">
            <ShieldCheck size={14} />
            PAN / VAT
          </div>
          <div className="mt-1 font-medium text-slate-800">{party.panNo ?? "—"}</div>
          <div className="mt-0.5 text-xs text-slate-500">
            {party.isVatRegistered ? "VAT Registered" : "Not VAT Registered"}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
          <div className="text-sm text-slate-500">Sub-Area</div>
          <div className="mt-1 font-medium text-slate-800">
            {party.subArea ? `${party.subArea.area.name} — ${party.subArea.name}` : "—"}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
          <div className="text-sm text-slate-500">Agent</div>
          <div className="mt-1 font-medium text-slate-800">{party.agent?.name ?? "—"}</div>
        </div>
      </div>

      {/* Customer / Vendor terms */}
      {(party.customerDetail || party.vendorDetail) && (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {party.customerDetail && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
              <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                <CreditCard size={15} className="text-emerald-600" />
                Customer Terms
              </div>
              <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-slate-500">Credit Limit</div>
                  <div className="mt-0.5 font-medium text-slate-800">
                    {party.customerDetail.creditLimit ? Number(party.customerDetail.creditLimit).toLocaleString() : "—"}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500">Credit Days</div>
                  <div className="mt-0.5 font-medium text-slate-800">{party.customerDetail.creditDays ?? "—"}</div>
                </div>
              </div>
            </div>
          )}
          {party.vendorDetail && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
              <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                <Truck size={15} className="text-amber-600" />
                Vendor Terms
              </div>
              <div className="mt-3 text-sm">
                <div className="text-slate-500">Payment Term Days</div>
                <div className="mt-0.5 font-medium text-slate-800">{party.vendorDetail.paymentTermDays ?? "—"}</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
