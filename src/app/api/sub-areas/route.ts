import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// No full Area/Sub-Area Master UI yet — this feeds simple "select a
// sub-area" dropdowns (e.g. on the Party form).
export async function GET() {
  const subAreas = await prisma.subArea.findMany({
    where: { isActive: true },
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
