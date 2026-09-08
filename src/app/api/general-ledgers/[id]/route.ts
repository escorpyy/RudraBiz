import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ledger = await prisma.generalLedger.findUnique({
    where: { id: Number(id) },
    include: { accountSubGroup: { include: { accountGroup: true } }, parent: true },
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
  } = body ?? {};

  try {
    const ledger = await prisma.generalLedger.update({
      where: { id: Number(id) },
      data: {
        code,
        name,
        accountSubGroupId: accountSubGroupId !== undefined ? Number(accountSubGroupId) : undefined,
        normalBalance,
        glType,
        parentId: parentId === null ? null : parentId !== undefined ? Number(parentId) : undefined,
        isCashOrBank,
        postsToCashBook,
        requiresSubLedger,
        allowDocAdjust,
        isActive,
      },
    });
    return NextResponse.json(ledger);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update general ledger.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ledgerId = Number(id);

  const childCount = await prisma.generalLedger.count({ where: { parentId: ledgerId } });
  if (childCount > 0) {
    return NextResponse.json(
      { error: `Cannot delete: ${childCount} ledger(s) are nested under this one. Reassign or delete them first.` },
      { status: 409 }
    );
  }

  const linkedParty = await prisma.party.findUnique({ where: { generalLedgerId: ledgerId } });
  if (linkedParty) {
    return NextResponse.json(
      { error: "Cannot delete: this ledger has a Party (customer/vendor) profile attached." },
      { status: 409 }
    );
  }

  const journalLineCount = await prisma.journalVoucherLine.count({ where: { generalLedgerId: ledgerId } });
  const cashBankLineCount = await prisma.cashBankVoucherLine.count({ where: { generalLedgerId: ledgerId } });
  if (journalLineCount > 0 || cashBankLineCount > 0) {
    return NextResponse.json(
      { error: "Cannot delete: this ledger has voucher entries posted against it." },
      { status: 409 }
    );
  }

  try {
    await prisma.generalLedger.delete({ where: { id: ledgerId } });
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete general ledger.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
