import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 💡 This line forces Next.js to treat this route as completely dynamic, 
// stopping it from running database queries during the build process.
export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const group = await prisma.accountGroup.findUnique({
    where: { id: Number(id) },
    include: { subGroups: { include: { generalLedgers: true } } },
  });
  if (!group) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(group);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { type, code, description, isActive } = body ?? {};

  const group = await prisma.accountGroup.update({
    where: { id: Number(id) },
    data: { type, code, description, isActive },
  });
  return NextResponse.json(group);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.accountGroup.delete({ where: { id: Number(id) } });
  return NextResponse.json({ success: true });
}
