import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import PartyForm from "@/components/parties/PartyForm";
import PartyInfoPanel from "@/components/parties/PartyInfoPanel";

export const dynamic = "force-dynamic";

export default async function EditPartyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const party = await prisma.party.findUnique({
    where: { id: Number(id) },
    include: {
      generalLedger: { include: { accountSubGroup: true } },
      customerDetail: true,
      vendorDetail: true,
    },
  });
  if (!party) notFound();

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Edit Party</h1>
          <div className="mt-1 flex items-center gap-1.5 text-sm">
            <Link href="/master/parties" className="text-brand hover:underline">
              Party Master
            </Link>
            <span className="text-slate-400">&gt;</span>
            <span className="text-slate-500">Edit {party.generalLedger.code}</span>
          </div>
        </div>
        <Link
          href={`/master/parties/${party.id}`}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <ArrowLeft size={16} />
          Back to Party
        </Link>
      </div>

      <div className="my-5 border-t border-slate-200" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
        <PartyForm
          initial={{
            id: party.id,
            code: party.generalLedger.code,
            name: party.generalLedger.name,
            accountGroupId: party.generalLedger.accountSubGroup.accountGroupId,
            accountSubGroupId: party.generalLedger.accountSubGroupId,
            glType: party.generalLedger.glType as "CUSTOMER" | "VENDOR" | "BOTH",
            status: party.generalLedger.isActive ? "ACTIVE" : "INACTIVE",
            address: party.address ?? "",
            city: party.city ?? "",
            state: party.state ?? "",
            country: party.country ?? "",
            phone: party.phone ?? "",
            mobile: party.mobile ?? "",
            email: party.email ?? "",
            contactPerson: party.contactPerson ?? "",
            panNo: party.panNo ?? "",
            isVatRegistered: party.isVatRegistered,
            subAreaId: party.subAreaId,
            agentId: party.agentId,
            creditLimit: party.customerDetail?.creditLimit ? String(party.customerDetail.creditLimit) : "",
            creditDays: party.customerDetail?.creditDays ? String(party.customerDetail.creditDays) : "",
            paymentTermDays: party.vendorDetail?.paymentTermDays ? String(party.vendorDetail.paymentTermDays) : "",
          }}
        />
        <PartyInfoPanel />
      </div>
    </div>
  );
}
