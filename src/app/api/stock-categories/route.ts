import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Feeds the Stock Category picker on the Product form (Stock detail only).
// No Stock Category Master UI exists yet — this route is currently only a
// read source, not a full master.
export async function GET() {
  const categories = await prisma.stockCategory.findMany({
    where: { isActive: true },
    orderBy: { code: "asc" },
    select: { id: true, code: true, name: true },
  });
  return NextResponse.json(categories);
}
