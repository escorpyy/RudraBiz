import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCompanyId } from "@/lib/companyContext";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireCompanyId();
  if (!ctx.ok) return NextResponse.json({ error: "No company selected." }, { status: 400 });

  const { id } = await params;
  const subGroup = await prisma.accountSubGroup.findFirst({
    where: { id: Number(id), accountGroup: { companyId: ctx.companyId } },
    include: { accountGroup: true, generalLedgers: true },
  });
  if (!subGroup) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(subGroup);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireCompanyId();
  if (!ctx.ok) return NextResponse.json({ error: "No company selected." }, { status: 400 });

  const { id } = await params;
  const existing = await prisma.accountSubGroup.findFirst({
    where: { id: Number(id), accountGroup: { companyId: ctx.companyId } },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const { accountGroupId, code, description, isActive } = body ?? {};

  if (accountGroupId !== undefined) {
    const parentGroup = await prisma.accountGroup.findFirst({
      where: { id: Number(accountGroupId), companyId: ctx.companyId },
    });
    if (!parentGroup) {
      return NextResponse.json({ error: "Account group not found." }, { status: 400 });
    }
  }

  try {
    const subGroup = await prisma.accountSubGroup.update({
      where: { id: Number(id) },
      data: {
        accountGroupId: accountGroupId !== undefined ? Number(accountGroupId) : undefined,
        code,
        description,
        isActive,
      },
    });
    return NextResponse.json(subGroup);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update account sub-group.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireCompanyId();
  if (!ctx.ok) return NextResponse.json({ error: "No company selected." }, { status: 400 });

  const { id } = await params;
  const subGroupId = Number(id);

  const existing = await prisma.accountSubGroup.findFirst({
    where: { id: subGroupId, accountGroup: { companyId: ctx.companyId } },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const ledgerCount = await prisma.generalLedger.count({ where: { accountSubGroupId: subGroupId } });
  if (ledgerCount > 0) {
    return NextResponse.json(
      { error: `Cannot delete: this sub-group has ${ledgerCount} ledger(s). Delete or reassign them first.` },
      { status: 409 }
    );
  }

  try {
    await prisma.accountSubGroup.delete({ where: { id: subGroupId } });
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete account sub-group.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
