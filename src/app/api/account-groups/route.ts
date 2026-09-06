export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET() {
  const groups = await prisma.accountGroup.findMany({
    orderBy: { code: "asc" },
    include: { subGroups: { include: { _count: { select: { generalLedgers: true } } } } },
  });
  return NextResponse.json(groups);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { type, code, description, isActive } = body ?? {};

  if (!type || !code || !description) {
    return NextResponse.json(
      { error: "type, code, and description are required." },
      { status: 400 }
    );
  }

  try {
    const group = await prisma.accountGroup.create({
      data: {
        type,
        code,
        description,
        isActive: typeof isActive === "boolean" ? isActive : true,
      },
    });
    return NextResponse.json(group, { status: 201 });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json(
        { error: "A group with that code already exists." },
        { status: 409 }
      );
    }
    console.error(err);
    return NextResponse.json({ error: "Failed to create account group." }, { status: 500 });
  }
}
