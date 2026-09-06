export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const subGroups = await prisma.accountSubGroup.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    include: { accountGroup: { select: { name: true } } },
  });
  return NextResponse.json(subGroups);
}
