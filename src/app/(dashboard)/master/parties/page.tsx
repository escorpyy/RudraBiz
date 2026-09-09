import Link from "next/link";
import { Plus, Users, CheckCircle2, Truck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import StatCard from "@/components/account-groups/StatCard";
import PartiesTable, { type PartyRow } from "@/components/parties/PartiesTable";
import type { GLType } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function PartiesPage() {
  const parties = await prisma.party.findMany({
    orderBy: { generalLedger: { name: "asc" } },
    include: {
      generalLedger: true,
      subArea: { include: { area: true } },
      agent: true,
    },
  });

  const rows: PartyRow[] = parties.map((p) => ({
    id: p.id,
    code: p.generalLedger.code,
    name: p.generalLedger.name,
    glType: p.generalLedger.glType as GLType,
    areaName: p.subArea ? `${p.subArea.area.name} — ${p.subArea.name}` : null,
    agentName: p.agent?.name ?? null,
    isActive: p.generalLedger.isActive,
  }));

  const activeCount = rows.filter((r) => r.isActive).length;
  const vendorCount = rows.filter((r) => r.glType === "VENDOR" || r.glType === "BOTH").length;

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Party Master</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage customers and vendors — each party is backed by its own general ledger
          </p>
        </div>
        <Link
          href="/master/parties/new"
          className="flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-hover"
        >
          <Plus size={16} />
          New Party
        </Link>
      </div>

      {/* Stat cards */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          icon={Users}
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
          label="Parties"
          value={rows.length}
          caption="Total customers & vendors"
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
          icon={Truck}
          iconBg="bg-amber-100"
          iconColor="text-amber-600"
          label="Vendors"
          value={vendorCount}
          caption="Vendor or Both type"
        />
      </div>

      <div className="mt-6">
        <PartiesTable rows={rows} />
      </div>
    </div>
  );
}
