import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCompanyId } from "@/lib/companyContext";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireCompanyId();
  if (!ctx.ok) return NextResponse.json({ error: "No company selected." }, { status: 400 });

  const { id } = await params;
  const subLedger = await prisma.subLedger.findFirst({
    where: {
      id: Number(id),
      OR: [{ generalLedger: { companyId: ctx.companyId } }, { party: { companyId: ctx.companyId } }],
    },
    include: { generalLedger: true, party: { include: { generalLedger: true } } },
  });
  if (!subLedger) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(subLedger);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireCompanyId();
  if (!ctx.ok) return NextResponse.json({ error: "No company selected." }, { status: 400 });

  const { id } = await params;
  const existing = await prisma.subLedger.findFirst({
    where: {
      id: Number(id),
      OR: [{ generalLedger: { companyId: ctx.companyId } }, { party: { companyId: ctx.companyId } }],
    },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const { code, name, generalLedgerId, partyId, isActive } = body ?? {};

  try {
    if (generalLedgerId) {
      const gl = await prisma.generalLedger.findFirst({ where: { id: Number(generalLedgerId), companyId: ctx.companyId } });
      if (!gl) {
        return NextResponse.json({ error: "General ledger not found." }, { status: 400 });
      }
    }
    if (partyId) {
      const party = await prisma.party.findFirst({ where: { id: Number(partyId), companyId: ctx.companyId } });
      if (!party) {
        return NextResponse.json({ error: "Party not found." }, { status: 400 });
      }
    }

    const subLedger = await prisma.subLedger.update({
      where: { id: Number(id) },
      data: {
        code,
        name,
        generalLedgerId: generalLedgerId === null ? null : generalLedgerId !== undefined ? Number(generalLedgerId) : undefined,
        partyId: partyId === null ? null : partyId !== undefined ? Number(partyId) : undefined,
        isActive,
      },
    });
    return NextResponse.json(subLedger);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update sub-ledger.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireCompanyId();
  if (!ctx.ok) return NextResponse.json({ error: "No company selected." }, { status: 400 });

  const { id } = await params;
  const subLedgerId = Number(id);

  const existing = await prisma.subLedger.findFirst({
    where: {
      id: subLedgerId,
      OR: [{ generalLedger: { companyId: ctx.companyId } }, { party: { companyId: ctx.companyId } }],
    },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    await prisma.subLedger.delete({ where: { id: subLedgerId } });
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete sub-ledger.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
