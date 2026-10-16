import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCompanyId } from "@/lib/companyContext";
import { describeBranchError } from "@/lib/branch";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireCompanyId();
  if (!ctx.ok) return NextResponse.json({ error: "No company selected." }, { status: 400 });

  const { id } = await params;
  const branch = await prisma.branch.findUnique({
    where: { id: Number(id) },
    include: {
      company: { select: { id: true, name: true } },
      _count: { select: { openingBalances: true, journalVouchers: true, cashBankVouchers: true } },
    },
  });
  if (!branch) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(branch);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireCompanyId();
  if (!ctx.ok) return NextResponse.json({ error: "No company selected." }, { status: 400 });

  const { id } = await params;
  const existing = await prisma.branch.findUnique({ where: { id: Number(id) } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const { code, name, isHeadOffice, address, phone, email, isActive } = body ?? {};

  const optional = (value: unknown) =>
    value === undefined ? undefined : typeof value === "string" && value.trim() ? value.trim() : null;

  try {
    const branch = await prisma.branch.update({
      where: { id: Number(id) },
      data: {
        code: code?.trim() || undefined,
        name: name?.trim() || undefined,
        isHeadOffice: typeof isHeadOffice === "boolean" ? isHeadOffice : undefined,
        address: optional(address),
        phone: optional(phone),
        email: optional(email),
        isActive: typeof isActive === "boolean" ? isActive : undefined,
      },
    });
    return NextResponse.json(branch);
  } catch (err) {
    return NextResponse.json({ error: describeBranchError(err) }, { status: 409 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireCompanyId();
  if (!ctx.ok) return NextResponse.json({ error: "No company selected." }, { status: 400 });

  const { id } = await params;
  const branchId = Number(id);

  const existing = await prisma.branch.findUnique({ where: { id: branchId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Dependent-record guard. Opening balances and both voucher tables carry a
  // NOT NULL branchId with onDelete: Restrict, so deleting a branch that has
  // any of them would fail at the database anyway — this reports which.
  const [openingBalances, stockOpeningBalances, journalVouchers, cashBankVouchers] = await Promise.all([
    prisma.openingBalance.count({ where: { branchId } }),
    prisma.stockOpeningBalance.count({ where: { branchId } }),
    prisma.journalVoucher.count({ where: { branchId } }),
    prisma.cashBankVoucher.count({ where: { branchId } }),
  ]);

  const blockers = [
    { label: "opening balance", plural: "opening balances", count: openingBalances },
    { label: "stock opening balance", plural: "stock opening balances", count: stockOpeningBalances },
    { label: "journal voucher", plural: "journal vouchers", count: journalVouchers },
    { label: "cash/bank voucher", plural: "cash/bank vouchers", count: cashBankVouchers },
  ].filter((b) => b.count > 0);

  if (blockers.length > 0) {
    const summary = blockers.map((b) => `${b.count} ${b.count === 1 ? b.label : b.plural}`).join(", ");
    return NextResponse.json(
      { error: `Cannot delete: this branch still has ${summary}. Deactivate it instead.` },
      { status: 409 }
    );
  }

  // A company with no branch can't record anything, since branchId is NOT
  // NULL on every transactional table — so refuse to remove the last one
  // rather than leaving the company unusable.
  const remaining = await prisma.branch.count({ where: { companyId: existing.companyId } });
  if (remaining <= 1) {
    return NextResponse.json(
      { error: "Cannot delete the only branch of a company. Create another branch first." },
      { status: 409 }
    );
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Access grants scoped to just this branch would dangle otherwise.
      await tx.userCompanyAccess.deleteMany({ where: { branchId } });
      await tx.branch.delete({ where: { id: branchId } });
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete branch.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
