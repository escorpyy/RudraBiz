import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { requireCompanyId } from "@/lib/companyContext";

export const dynamic = "force-dynamic";

// Feeds simple "select a sub-area" dropdowns (e.g. on the Party form) as
// well as the Sub-Areas tab of the Area Master UI.
export async function GET() {
  const ctx = await requireCompanyId();
  if (!ctx.ok) return NextResponse.json({ error: "No company selected." }, { status: 400 });

  const subAreas = await prisma.subArea.findMany({
    where: { isActive: true, area: { companyId: ctx.companyId } },
    orderBy: [{ area: { name: "asc" } }, { name: "asc" }],
    select: { id: true, code: true, name: true, area: { select: { name: true } } },
  });
  return NextResponse.json(
    subAreas.map((sa) => ({
      id: sa.id,
      code: sa.code,
      name: sa.name,
      areaName: sa.area.name,
    }))
  );
}

export async function POST(req: NextRequest) {
  const ctx = await requireCompanyId();
  if (!ctx.ok) return NextResponse.json({ error: "No company selected." }, { status: 400 });

  const body = await req.json();
  const { areaId, code, name, shortName, isActive } = body ?? {};

  if (!areaId || !code || !name || !shortName) {
    return NextResponse.json(
      { error: "areaId, code, name, and shortName are required." },
      { status: 400 }
    );
  }

  const parentArea = await prisma.area.findFirst({ where: { id: Number(areaId), companyId: ctx.companyId } });
  if (!parentArea) {
    return NextResponse.json({ error: "Area not found." }, { status: 400 });
  }

  try {
    const subArea = await prisma.subArea.create({
      data: {
        areaId: Number(areaId),
        code,
        name,
        shortName,
        isActive: typeof isActive === "boolean" ? isActive : true,
      },
    });
    return NextResponse.json(subArea, { status: 201 });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json(
        { error: "A sub-area with that code, name, or short name already exists in this area." },
        { status: 409 }
      );
    }
    const message = err instanceof Error ? err.message : "Failed to create sub-area.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
