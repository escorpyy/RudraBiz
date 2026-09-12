import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const group = await prisma.productGroup.findUnique({
    where: { id: Number(id) },
    include: { subGroups: { orderBy: { code: "asc" }, include: { _count: { select: { products: true } } } } },
  });
  if (!group) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(group);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { code, name, isActive } = body ?? {};

  try {
    const group = await prisma.productGroup.update({
      where: { id: Number(id) },
      data: { code, name, isActive },
    });
    return NextResponse.json(group);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json({ error: "A product group with that code or name already exists." }, { status: 409 });
    }
    const message = err instanceof Error ? err.message : "Failed to update product group.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const groupId = Number(id);

  const subGroupCount = await prisma.productSubGroup.count({ where: { productGroupId: groupId } });
  if (subGroupCount > 0) {
    return NextResponse.json(
      { error: `Cannot delete: this group has ${subGroupCount} sub-group(s). Delete or reassign them first.` },
      { status: 409 }
    );
  }

  try {
    await prisma.productGroup.delete({ where: { id: groupId } });
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return NextResponse.json({ error: "Product group not found." }, { status: 404 });
    }
    const message = err instanceof Error ? err.message : "Failed to delete product group.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
