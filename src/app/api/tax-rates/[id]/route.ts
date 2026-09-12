import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const taxRate = await prisma.taxRate.findUnique({
    where: { id: Number(id) },
    include: {
      _count: { select: { stockDetails: true, nonStockDetails: true, serviceDetails: true } },
    },
  });
  if (!taxRate) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(taxRate);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { code, name, ratePercent, hsnSacCode, isActive } = body ?? {};

  if (ratePercent !== undefined) {
    const rate = Number(ratePercent);
    if (!Number.isFinite(rate) || rate < 0 || rate > 100) {
      return NextResponse.json({ error: "Rate % must be a number between 0 and 100." }, { status: 400 });
    }
  }

  try {
    const taxRate = await prisma.taxRate.update({
      where: { id: Number(id) },
      data: {
        code,
        name,
        ratePercent: ratePercent !== undefined ? Number(ratePercent) : undefined,
        hsnSacCode: hsnSacCode !== undefined ? hsnSacCode || null : undefined,
        isActive,
      },
    });
    return NextResponse.json(taxRate);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json({ error: "A tax rate with that code already exists." }, { status: 409 });
    }
    const message = err instanceof Error ? err.message : "Failed to update tax rate.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    // StockDetail/NonStockDetail/ServiceDetail.taxRateId are all
    // onDelete: SetNull — deleting a tax rate simply unlinks it from any
    // products using it, same convention as deleting an Agent.
    await prisma.taxRate.delete({ where: { id: Number(id) } });
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return NextResponse.json({ error: "Tax rate not found." }, { status: 404 });
    }
    const message = err instanceof Error ? err.message : "Failed to delete tax rate.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
