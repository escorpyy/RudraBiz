import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Feeds the Tax Rate picker on the Product form (Stock / Non-Stock /
// Service details). No Tax Rate Master UI exists yet — this route is
// currently only a read source, not a full master.
export async function GET() {
  const rates = await prisma.taxRate.findMany({
    where: { isActive: true },
    orderBy: { code: "asc" },
    select: { id: true, code: true, name: true, ratePercent: true, hsnSacCode: true },
  });
  return NextResponse.json(rates);
}
