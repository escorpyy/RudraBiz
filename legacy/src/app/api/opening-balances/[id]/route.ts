import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireCompanyId } from "@/lib/companyContext";
import { validateAmounts, describeWriteError } from "@/lib/openingBalance";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireCompanyId();
  if (!ctx.ok) return NextResponse.json({ error: "No company selected." }, { status: 400 });

  const { id } = await params;
  const row = await prisma.openingBalance.findFirst({
    where: { id: Number(id), companyId: ctx.companyId },
    include: {
      generalLedger: { select: { id: true, code: true, name: true } },
      subLedger: { select: { id: true, code: true, name: true } },
      branch: { select: { id: true, code: true, name: true } },
      fiscalYear: { select: { id: true, code: true } },
      carriedForwardFrom: { select: { id: true, fiscalYear: { select: { code: true } } } },
      _count: { select: { carriedForwardTo: true } },
    },
  });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(row);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireCompanyId();
  if (!ctx.ok) return NextResponse.json({ error: "No company selected." }, { status: 400 });

  const { id } = await params;
  const existing = await prisma.openingBalance.findFirst({
    where: { id: Number(id), companyId: ctx.companyId },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const { branchId, generalLedgerId, subLedgerId, debit, credit, remarks } = body ?? {};

  // Amounts are only re-validated when either side is actually being
  // changed, so a PATCH that touches just the remarks (or a bulk PATCH from
  // the table) isn't rejected for not resending them.
  let debitUpdate: Prisma.Decimal | undefined;
  let creditUpdate: Prisma.Decimal | undefined;
  if (debit !== undefined || credit !== undefined) {
    const debitValue = Number(debit ?? existing.debit);
    const creditValue = Number(credit ?? existing.credit);
    const amountError = validateAmounts(debitValue, creditValue);
    if (amountError) return NextResponse.json({ error: amountError }, { status: 400 });
    debitUpdate = new Prisma.Decimal(debitValue);
    creditUpdate = new Prisma.Decimal(creditValue);
  }

  if (branchId !== undefined) {
    const branch = await prisma.branch.findFirst({
      where: { id: Number(branchId), companyId: ctx.companyId, isActive: true },
    });
    if (!branch) return NextResponse.json({ error: "Branch not found." }, { status: 400 });
  }

  if (generalLedgerId !== undefined) {
    const generalLedger = await prisma.generalLedger.findFirst({
      where: { id: Number(generalLedgerId), companyId: ctx.companyId },
    });
    if (!generalLedger) return NextResponse.json({ error: "General ledger not found." }, { status: 400 });
  }

  if (subLedgerId) {
    const subLedger = await prisma.subLedger.findFirst({
      where: {
        id: Number(subLedgerId),
        OR: [{ generalLedger: { companyId: ctx.companyId } }, { party: { companyId: ctx.companyId } }],
      },
    });
    if (!subLedger) return NextResponse.json({ error: "Sub-ledger not found." }, { status: 400 });
  }

  try {
    const updated = await prisma.openingBalance.update({
      where: { id: Number(id) },
      data: {
        branchId: branchId !== undefined ? Number(branchId) : undefined,
        generalLedgerId: generalLedgerId !== undefined ? Number(generalLedgerId) : undefined,
        subLedgerId:
          subLedgerId === undefined ? undefined : subLedgerId === null ? null : Number(subLedgerId),
        debit: debitUpdate,
        credit: creditUpdate,
        remarks: remarks === undefined ? undefined : remarks?.trim() ? remarks.trim() : null,
      },
    });
    return NextResponse.json(updated);
  } catch (err) {
    return NextResponse.json({ error: describeWriteError(err) }, { status: 409 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireCompanyId();
  if (!ctx.ok) return NextResponse.json({ error: "No company selected." }, { status: 400 });

  const { id } = await params;
  const rowId = Number(id);

  const existing = await prisma.openingBalance.findFirst({
    where: { id: rowId, companyId: ctx.companyId },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Dependent-record guard, matching the convention used by account-groups
  // (sub-groups) and product-groups (sub-groups): a row that a later fiscal
  // year's opening balance was rolled forward from is referenced by
  // OpeningBalance.carriedForwardFromId. Deleting it would silently sever
  // that audit trail, so block and tell the user what's in the way.
  const carriedForwardCount = await prisma.openingBalance.count({
    where: { carriedForwardFromId: rowId },
  });
  if (carriedForwardCount > 0) {
    return NextResponse.json(
      {
        error: `Cannot delete: this opening balance was carried forward into ${carriedForwardCount} later fiscal year entr${
          carriedForwardCount === 1 ? "y" : "ies"
        }. Delete those first.`,
      },
      { status: 409 }
    );
  }

  try {
    await prisma.openingBalance.delete({ where: { id: rowId } });
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete opening balance.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
