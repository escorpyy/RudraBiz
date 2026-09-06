import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET() {
  const groups = await prisma.accountGroup.findMany({
    orderBy: { order: "asc" },
    include: { subGroups: { include: { _count: { select: { ledgers: true } } } } },
  });
  return NextResponse.json(groups);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { accountType, code, name, description, order, status } = body ?? {};

  if (!accountType || !code || !name) {
    return NextResponse.json(
      { error: "accountType, code, and name are required." },
      { status: 400 }
    );
  }

  try {
    const group = await prisma.accountGroup.create({
      data: {
        accountType,
        code,
        name,
        description: description ?? null,
        order: typeof order === "number" ? order : 0,
        status: status ?? "ACTIVE",
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
