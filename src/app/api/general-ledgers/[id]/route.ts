import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ledger = await prisma.generalLedger.findUnique({
    where: { id: Number(id) },
    include: { accountSubGroup: { include: { accountGroup: true } }, parent: true, children: true },
  });
  if (!ledger) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(ledger);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const {
    code,
    name,
    accountSubGroupId,
    normalBalance,
    glType,
    parentId,
    isCashOrBank,
    postsToCashBook,
    requiresSubLedger,
    allowDocAdjust,
    isActive,
    subAreaId,
    agentId,
  } = body ?? {};

  const ledger = await prisma.generalLedger.update({
    where: { id: Number(id) },
    data: {
      code,
      name,
      accountSubGroupId: accountSubGroupId !== undefined ? Number(accountSubGroupId) : undefined,
      normalBalance,
      glType,
      parentId: parentId === undefined ? undefined : parentId ? Number(parentId) : null,
      isCashOrBank,
      postsToCashBook,
      requiresSubLedger,
      allowDocAdjust,
      isActive,
      subAreaId: subAreaId === undefined ? undefined : subAreaId ? Number(subAreaId) : null,
      agentId: agentId === undefined ? undefined : agentId ? Number(agentId) : null,
    },
  });
  return NextResponse.json(ledger);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.generalLedger.delete({ where: { id: Number(id) } });
  return NextResponse.json({ success: true });
}
