export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET() {
  const areas = await prisma.area.findMany({
    orderBy: { code: "asc" },
    include: { subAreas: { include: { _count: { select: { generalLedgers: true, parties: true } } } } },
  });
  return NextResponse.json(areas);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { code, name, shortName, isActive } = body ?? {};

  if (!code || !name || !shortName) {
    return NextResponse.json(
      { error: "code, name, and shortName are required." },
      { status: 400 }
    );
  }

  try {
    const area = await prisma.area.create({
      data: {
        code,
        name,
        shortName,
        isActive: typeof isActive === "boolean" ? isActive : true,
      },
    });
    return NextResponse.json(area, { status: 201 });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json(
        { error: "An area with that code, name, or short name already exists." },
        { status: 409 }
      );
    }
    console.error(err);
    return NextResponse.json({ error: "Failed to create area." }, { status: 500 });
  }
}
