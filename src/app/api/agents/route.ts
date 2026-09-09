import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// No full Agent Master UI yet — this feeds simple "select an agent"
// dropdowns (e.g. on the Party form).
export async function GET() {
  const agents = await prisma.agent.findMany({
    where: { isActive: true },
    orderBy: { code: "asc" },
    select: { id: true, code: true, name: true },
  });
  return NextResponse.json(agents);
}
