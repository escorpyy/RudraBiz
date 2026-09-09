import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// Forces Next.js to treat this route as completely dynamic, stopping it
// from running database queries during the build process.
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const area = await prisma.area.findUnique({
    where: { id: Number(id) },
    include: {
      subAreas: {
        orderBy: { code: "asc" },
        include: { _count: { select: { generalLedgers: true, parties: true } } },
      },
    },
  });
  if (!area) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(area);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { code, name, shortName, isActive } = body ?? {};

  try {
    const area = await prisma.area.update({
      where: { id: Number(id) },
      data: { code, name, shortName, isActive },
    });
    return NextResponse.json(area);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json(
        { error: "An area with that code, name, or short name already exists." },
        { status: 409 }
      );
    }
    const message = err instanceof Error ? err.message : "Failed to update area.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const areaId = Number(id);

  const subAreaCount = await prisma.subArea.count({ where: { areaId } });
  if (subAreaCount > 0) {
    return NextResponse.json(
      { error: `Cannot delete: this area has ${subAreaCount} sub-area(s). Delete or reassign them first.` },
      { status: 409 }
    );
  }

  try {
    await prisma.area.delete({ where: { id: areaId } });
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete area.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
