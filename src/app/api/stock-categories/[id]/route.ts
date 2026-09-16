import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { requireCompanyId } from "@/lib/companyContext";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireCompanyId();
  if (!ctx.ok) return NextResponse.json({ error: "No company selected." }, { status: 400 });

  const { id } = await params;
  const category = await prisma.stockCategory.findFirst({
    where: { id: Number(id), companyId: ctx.companyId },
    include: { _count: { select: { stockDetails: true } } },
  });
  if (!category) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(category);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireCompanyId();
  if (!ctx.ok) return NextResponse.json({ error: "No company selected." }, { status: 400 });

  const { id } = await params;
  const existing = await prisma.stockCategory.findFirst({ where: { id: Number(id), companyId: ctx.companyId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const { code, name, isActive } = body ?? {};

  try {
    const category = await prisma.stockCategory.update({
      where: { id: Number(id) },
      data: { code, name, isActive },
    });
    return NextResponse.json(category);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json(
        { error: "A stock category with that code or name already exists." },
        { status: 409 }
      );
    }
    const message = err instanceof Error ? err.message : "Failed to update stock category.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireCompanyId();
  if (!ctx.ok) return NextResponse.json({ error: "No company selected." }, { status: 400 });

  const { id } = await params;

  const existing = await prisma.stockCategory.findFirst({ where: { id: Number(id), companyId: ctx.companyId } });
  if (!existing) return NextResponse.json({ error: "Stock category not found." }, { status: 404 });

  try {
    // StockDetail.stockCategoryId is onDelete: SetNull — deleting a
    // category simply unlinks it from any stock products, same convention
    // as deleting an Agent.
    await prisma.stockCategory.delete({ where: { id: Number(id) } });
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return NextResponse.json({ error: "Stock category not found." }, { status: 404 });
    }
    const message = err instanceof Error ? err.message : "Failed to delete stock category.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
