import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const location = await prisma.location.findUnique({
    where: { id: Number(id) },
    include: {
      parent: true,
      children: { orderBy: { code: "asc" } },
      _count: { select: { children: true, stockDetails: true, fixedAssetDetails: true } },
    },
  });
  if (!location) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(location);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const locationId = Number(id);
  const body = await req.json();
  const { code, name, parentId, isActive } = body ?? {};

  if (parentId !== undefined && parentId !== null && Number(parentId) === locationId) {
    return NextResponse.json({ error: "A location can't be its own parent." }, { status: 400 });
  }

  try {
    const location = await prisma.location.update({
      where: { id: locationId },
      data: {
        code,
        name,
        parentId: parentId === null ? null : parentId !== undefined ? Number(parentId) : undefined,
        isActive,
      },
    });
    return NextResponse.json(location);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json({ error: "A location with that code already exists." }, { status: 409 });
    }
    const message = err instanceof Error ? err.message : "Failed to update location.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const locationId = Number(id);

  // Location.parentId is onDelete: Restrict — a location with child
  // locations can't be deleted until they're reassigned or removed.
  // StockDetail/FixedAssetDetail location links are SetNull, so they don't
  // block deletion (they just unlink), matching the Agent convention.
  const childCount = await prisma.location.count({ where: { parentId: locationId } });
  if (childCount > 0) {
    return NextResponse.json(
      { error: `Cannot delete: this location has ${childCount} child location(s). Delete or reassign them first.` },
      { status: 409 }
    );
  }

  try {
    await prisma.location.delete({ where: { id: locationId } });
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return NextResponse.json({ error: "Location not found." }, { status: 404 });
    }
    const message = err instanceof Error ? err.message : "Failed to delete location.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
