import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Feeds the Location picker on the Product form (Stock default location,
// Fixed Asset location). No Location Master UI exists yet — this route is
// currently only a read source, not a full master.
export async function GET() {
  const locations = await prisma.location.findMany({
    where: { isActive: true },
    orderBy: { code: "asc" },
    include: { parent: { select: { name: true } } },
  });
  return NextResponse.json(
    locations.map((l) => ({
      id: l.id,
      code: l.code,
      name: l.name,
      parentName: l.parent?.name ?? null,
    }))
  );
}
