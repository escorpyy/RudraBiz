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
  const groupId = Number(id);

  const subGroupCount = await prisma.accountSubGroup.count({ where: { accountGroupId: groupId } });
  if (subGroupCount > 0) {
    return NextResponse.json(
      { error: `Cannot delete: this group has ${subGroupCount} sub-group(s). Delete or reassign them first.` },
      { status: 409 }
    );
  }

  try {
    await prisma.accountGroup.delete({ where: { id: groupId } });
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete account group.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
