import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

// Also feeds the Location picker on the Product form (Stock default
// location, Fixed Asset location).
export async function GET() {
  const locations = await prisma.location.findMany({
    orderBy: { code: "asc" },
    include: {
      parent: { select: { name: true } },
      _count: { select: { children: true, stockDetails: true, fixedAssetDetails: true } },
    },
  });
  return NextResponse.json(
    locations.map((l) => ({
      id: l.id,
      code: l.code,
      name: l.name,
      parentId: l.parentId,
      parentName: l.parent?.name ?? null,
      isActive: l.isActive,
      childrenCount: l._count.children,
      inUseCount: l._count.stockDetails + l._count.fixedAssetDetails,
    }))
  );
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { code, name, parentId, isActive } = body ?? {};

  if (!code || !name) {
    return NextResponse.json({ error: "Code and Name are required." }, { status: 400 });
  }

  try {
    const location = await prisma.location.create({
      data: {
        code,
        name,
        parentId: parentId ? Number(parentId) : null,
        isActive: typeof isActive === "boolean" ? isActive : true,
      },
    });
    return NextResponse.json(location, { status: 201 });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json({ error: "A location with that code already exists." }, { status: 409 });
    }
    const message = err instanceof Error ? err.message : "Failed to create location.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
