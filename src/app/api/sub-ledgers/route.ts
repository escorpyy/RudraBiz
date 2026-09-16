import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCompanyId } from "@/lib/companyContext";

export const dynamic = "force-dynamic";

export async function GET() {
  const ctx = await requireCompanyId();
  if (!ctx.ok) return NextResponse.json({ error: "No company selected." }, { status: 400 });

  const subLedgers = await prisma.subLedger.findMany({
    where: {
      isActive: true,
      OR: [
        { generalLedger: { companyId: ctx.companyId } },
        { party: { companyId: ctx.companyId } },
      ],
    },
    orderBy: { code: "asc" },
    select: { id: true, code: true, name: true },
  });
  return NextResponse.json(subLedgers);
}

export async function POST(req: NextRequest) {
  const ctx = await requireCompanyId();
  if (!ctx.ok) return NextResponse.json({ error: "No company selected." }, { status: 400 });

  const body = await req.json();
  const { code, name, generalLedgerId, partyId, isActive } = body ?? {};

  if (!code || !name) {
    return NextResponse.json(
      { error: "Sub-Ledger Code and Sub-Ledger Name are required." },
      { status: 400 }
    );
  }

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

    const subLedger = await prisma.subLedger.create({
      data: {
        code,
        name,
        generalLedgerId: generalLedgerId ? Number(generalLedgerId) : null,
        partyId: partyId ? Number(partyId) : null,
        isActive: typeof isActive === "boolean" ? isActive : true,
      },
    });
    return NextResponse.json(subLedger, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create sub-ledger.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
