export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { requireCompanyId } from "@/lib/companyContext";

export async function GET() {
  const ctx = await requireCompanyId();
  if (!ctx.ok) return NextResponse.json({ error: "No company selected." }, { status: 400 });

  const groups = await prisma.accountGroup.findMany({
    where: { companyId: ctx.companyId },
    orderBy: { code: "asc" },
    include: { subGroups: { include: { _count: { select: { generalLedgers: true } } } } },
  });
  return NextResponse.json(groups);
}

export async function POST(req: NextRequest) {
  const ctx = await requireCompanyId();
  if (!ctx.ok) return NextResponse.json({ error: "No company selected." }, { status: 400 });

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
        companyId: ctx.companyId,
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
