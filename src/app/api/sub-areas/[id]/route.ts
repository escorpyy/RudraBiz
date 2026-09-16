import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { requireCompanyId } from "@/lib/companyContext";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireCompanyId();
  if (!ctx.ok) return NextResponse.json({ error: "No company selected." }, { status: 400 });

  const { id } = await params;
  const subArea = await prisma.subArea.findFirst({
    where: { id: Number(id), area: { companyId: ctx.companyId } },
    include: {
      area: true,
      generalLedgers: { orderBy: { code: "asc" } },
      parties: { include: { generalLedger: true }, orderBy: { id: "asc" } },
    },
  });
  if (!subArea) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(subArea);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireCompanyId();
  if (!ctx.ok) return NextResponse.json({ error: "No company selected." }, { status: 400 });

  const { id } = await params;
  const existing = await prisma.subArea.findFirst({
    where: { id: Number(id), area: { companyId: ctx.companyId } },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const { areaId, code, name, shortName, isActive } = body ?? {};

  if (areaId !== undefined) {
    const parentArea = await prisma.area.findFirst({ where: { id: Number(areaId), companyId: ctx.companyId } });
    if (!parentArea) {
      return NextResponse.json({ error: "Area not found." }, { status: 400 });
    }
  }

  try {
    const subArea = await prisma.subArea.update({
      where: { id: Number(id) },
      data: {
        areaId: areaId !== undefined ? Number(areaId) : undefined,
        code,
        name,
        shortName,
        isActive,
      },
    });
    return NextResponse.json(subArea);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json(
        { error: "A sub-area with that code, name, or short name already exists in this area." },
        { status: 409 }
      );
    }
    const message = err instanceof Error ? err.message : "Failed to update sub-area.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireCompanyId();
  if (!ctx.ok) return NextResponse.json({ error: "No company selected." }, { status: 400 });

  const { id } = await params;
  const subAreaId = Number(id);

  const existing = await prisma.subArea.findFirst({
    where: { id: subAreaId, area: { companyId: ctx.companyId } },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [ledgerCount, partyCount] = await Promise.all([
    prisma.generalLedger.count({ where: { subAreaId } }),
    prisma.party.count({ where: { subAreaId } }),
  ]);
  const dependents = ledgerCount + partyCount;
  if (dependents > 0) {
    return NextResponse.json(
      {
        error: `Cannot delete: this sub-area is used by ${ledgerCount} ledger(s) and ${partyCount} part${
          partyCount === 1 ? "y" : "ies"
        }. Reassign them first.`,
      },
      { status: 409 }
    );
  }

  try {
    await prisma.subArea.delete({ where: { id: subAreaId } });
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete sub-area.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
