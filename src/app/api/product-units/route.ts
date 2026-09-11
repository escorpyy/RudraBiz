import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Feeds "select a unit" pickers (base unit, alternate units, non-stock/
// service unit) on the Product form. No Unit Master UI exists yet — this
// route is currently only a read source, not a full master.
export async function GET() {
  const units = await prisma.productUnit.findMany({
    where: { isActive: true },
    orderBy: { code: "asc" },
    select: { id: true, code: true, name: true, decimalPlaces: true },
  });
  return NextResponse.json(units);
}
