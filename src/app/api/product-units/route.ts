import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

// Also feeds "select a unit" pickers (base unit, alternate units,
// non-stock/service unit) on the Product form.
export async function GET() {
  const units = await prisma.productUnit.findMany({
    orderBy: { code: "asc" },
    include: {
      _count: {
        select: { stockBaseFor: true, nonStockUnitFor: true, serviceUnitFor: true, alternateUnitFor: true },
      },
    },
  });
  return NextResponse.json(units);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { code, name, decimalPlaces, isActive } = body ?? {};

  if (!code || !name) {
    return NextResponse.json({ error: "Code and Name are required." }, { status: 400 });
  }
  const dp = decimalPlaces === undefined || decimalPlaces === null || decimalPlaces === "" ? 0 : Number(decimalPlaces);
  if (!Number.isInteger(dp) || dp < 0 || dp > 6) {
    return NextResponse.json({ error: "Decimal Places must be a whole number between 0 and 6." }, { status: 400 });
  }

  try {
    const unit = await prisma.productUnit.create({
      data: { code, name, decimalPlaces: dp, isActive: typeof isActive === "boolean" ? isActive : true },
    });
    return NextResponse.json(unit, { status: 201 });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json({ error: "A unit with that code or name already exists." }, { status: 409 });
    }
    const message = err instanceof Error ? err.message : "Failed to create unit.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
