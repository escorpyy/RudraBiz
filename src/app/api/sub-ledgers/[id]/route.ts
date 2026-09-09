import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const subLedger = await prisma.subLedger.findUnique({
    where: { id: Number(id) },
    include: { generalLedger: true, party: { include: { generalLedger: true } } },
  });
  if (!subLedger) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(subLedger);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { code, name, generalLedgerId, partyId, isActive } = body ?? {};

  try {
    if (generalLedgerId) {
      const gl = await prisma.generalLedger.findUnique({ where: { id: Number(generalLedgerId) } });
      if (!gl) {
        return NextResponse.json({ error: "General ledger not found." }, { status: 400 });
      }
    }
    if (partyId) {
      const party = await prisma.party.findUnique({ where: { id: Number(partyId) } });
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
  const { id } = await params;
  const subLedgerId = Number(id);

  try {
    await prisma.subLedger.delete({ where: { id: subLedgerId } });
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete sub-ledger.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
