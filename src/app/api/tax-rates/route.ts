import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

// Also feeds the Tax Rate picker on the Product form (Stock / Non-Stock /
// Service details).
export async function GET() {
  const rates = await prisma.taxRate.findMany({
    orderBy: { code: "asc" },
    include: {
      _count: { select: { stockDetails: true, nonStockDetails: true, serviceDetails: true } },
    },
  });
  return NextResponse.json(rates);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { code, name, ratePercent, hsnSacCode, isActive } = body ?? {};

  if (!code || !name || ratePercent === undefined || ratePercent === null || ratePercent === "") {
    return NextResponse.json({ error: "Code, Name, and Rate % are required." }, { status: 400 });
  }
  const rate = Number(ratePercent);
  if (!Number.isFinite(rate) || rate < 0 || rate > 100) {
    return NextResponse.json({ error: "Rate % must be a number between 0 and 100." }, { status: 400 });
  }

  try {
    const taxRate = await prisma.taxRate.create({
      data: {
        code,
        name,
        ratePercent: rate,
        hsnSacCode: hsnSacCode || null,
        isActive: typeof isActive === "boolean" ? isActive : true,
      },
    });
    return NextResponse.json(taxRate, { status: 201 });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json({ error: "A tax rate with that code already exists." }, { status: 409 });
    }
    const message = err instanceof Error ? err.message : "Failed to create tax rate.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
