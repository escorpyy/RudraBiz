import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { requireCompanyId } from "@/lib/companyContext";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireCompanyId();
  if (!ctx.ok) return NextResponse.json({ error: "No company selected." }, { status: 400 });

  const { id } = await params;
  const subGroup = await prisma.productSubGroup.findFirst({
    where: { id: Number(id), productGroup: { companyId: ctx.companyId } },
    include: {
      productGroup: true,
      products: { orderBy: { code: "asc" }, select: { id: true, code: true, description: true, type: true, isActive: true } },
    },
  });
  if (!subGroup) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(subGroup);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireCompanyId();
  if (!ctx.ok) return NextResponse.json({ error: "No company selected." }, { status: 400 });

  const { id } = await params;
  const existing = await prisma.productSubGroup.findFirst({
    where: { id: Number(id), productGroup: { companyId: ctx.companyId } },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const { productGroupId, code, name, isActive } = body ?? {};

  if (productGroupId !== undefined) {
    const parentGroup = await prisma.productGroup.findFirst({
      where: { id: Number(productGroupId), companyId: ctx.companyId },
    });
    if (!parentGroup) {
      return NextResponse.json({ error: "Product group not found." }, { status: 400 });
    }
  }

  try {
    const subGroup = await prisma.productSubGroup.update({
      where: { id: Number(id) },
      data: {
        productGroupId: productGroupId !== undefined ? Number(productGroupId) : undefined,
        code,
        name,
        isActive,
      },
    });
    return NextResponse.json(subGroup);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json(
        { error: "A sub-group with that code or name already exists in this group." },
        { status: 409 }
      );
    }
    const message = err instanceof Error ? err.message : "Failed to update product sub-group.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireCompanyId();
  if (!ctx.ok) return NextResponse.json({ error: "No company selected." }, { status: 400 });

  const { id } = await params;
  const subGroupId = Number(id);

  const existing = await prisma.productSubGroup.findFirst({
    where: { id: subGroupId, productGroup: { companyId: ctx.companyId } },
  });
  if (!existing) return NextResponse.json({ error: "Product sub-group not found." }, { status: 404 });

  const productCount = await prisma.product.count({ where: { productSubGroupId: subGroupId } });
  if (productCount > 0) {
    return NextResponse.json(
      { error: `Cannot delete: this sub-group has ${productCount} product(s). Delete or reassign them first.` },
      { status: 409 }
    );
  }

  try {
    await prisma.productSubGroup.delete({ where: { id: subGroupId } });
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return NextResponse.json({ error: "Product sub-group not found." }, { status: 404 });
    }
    const message = err instanceof Error ? err.message : "Failed to delete product sub-group.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
