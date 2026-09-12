import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const unit = await prisma.productUnit.findUnique({
    where: { id: Number(id) },
    include: {
      _count: {
        select: { stockBaseFor: true, nonStockUnitFor: true, serviceUnitFor: true, alternateUnitFor: true },
      },
    },
  });
  if (!unit) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(unit);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { code, name, decimalPlaces, isActive } = body ?? {};

  if (decimalPlaces !== undefined) {
    const dp = Number(decimalPlaces);
    if (!Number.isInteger(dp) || dp < 0 || dp > 6) {
      return NextResponse.json({ error: "Decimal Places must be a whole number between 0 and 6." }, { status: 400 });
    }
  }

  try {
    const unit = await prisma.productUnit.update({
      where: { id: Number(id) },
      data: {
        code,
        name,
        decimalPlaces: decimalPlaces !== undefined ? Number(decimalPlaces) : undefined,
        isActive,
      },
    });
    return NextResponse.json(unit);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json({ error: "A unit with that code or name already exists." }, { status: 409 });
    }
    const message = err instanceof Error ? err.message : "Failed to update unit.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const unitId = Number(id);

  // StockDetail.baseUnitId, NonStockDetail.unitId, and AlternateUnit.unitId
  // are all onDelete: Restrict — a unit that's actually in use on a product
  // can't be deleted at the DB level. ServiceDetail.unitId is SetNull, so
  // it isn't part of this guard (deleting just unlinks it there).
  const [stockCount, nonStockCount, altUnitCount] = await Promise.all([
    prisma.stockDetail.count({ where: { baseUnitId: unitId } }),
    prisma.nonStockDetail.count({ where: { unitId } }),
    prisma.alternateUnit.count({ where: { unitId } }),
  ]);
  const inUseCount = stockCount + nonStockCount + altUnitCount;
  if (inUseCount > 0) {
    return NextResponse.json(
      { error: `Cannot delete: this unit is used on ${inUseCount} product record(s). Reassign them first.` },
      { status: 409 }
    );
  }

  try {
    await prisma.productUnit.delete({ where: { id: unitId } });
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return NextResponse.json({ error: "Unit not found." }, { status: 404 });
    }
    const message = err instanceof Error ? err.message : "Failed to delete unit.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
