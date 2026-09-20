import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCompanyId } from "@/lib/companyContext";

export const dynamic = "force-dynamic";

export async function GET() {
  const ctx = await requireCompanyId();
  if (!ctx.ok) return NextResponse.json({ error: "No company selected." }, { status: 400 });

  const ledgers = await prisma.generalLedger.findMany({
    where: { isActive: true, companyId: ctx.companyId },
    orderBy: { code: "asc" },
    select: {
      id: true,
      code: true,
      name: true,
      normalBalance: true,
      // Group > Sub-Group path, so pickers (e.g. the Journal Voucher line
      // Account Head combobox) can show where a ledger sits in the chart
      // of accounts, same as the screenshot's "Expenses > Operating
      // Expenses" caption.
      accountSubGroup: {
        select: {
          description: true,
          accountGroup: { select: { description: true } },
        },
      },
    },
  });

  const shaped = ledgers.map((l) => ({
    id: l.id,
    code: l.code,
    name: l.name,
    normalBalance: l.normalBalance,
    groupPath: `${l.accountSubGroup.accountGroup.description} > ${l.accountSubGroup.description}`,
  }));

  return NextResponse.json(shaped);
}

export async function POST(req: NextRequest) {
  const ctx = await requireCompanyId();
  if (!ctx.ok) return NextResponse.json({ error: "No company selected." }, { status: 400 });

  const body = await req.json();
  const {
    code,
    name,
    accountSubGroupId,
    glType,
    parentId,
    isCashOrBank,
    postsToCashBook,
    requiresSubLedger,
    allowDocAdjust,
    isActive,
  } = body ?? {};

  if (!code || !name || !accountSubGroupId) {
    return NextResponse.json(
      { error: "code, name, and accountSubGroupId are required." },
      { status: 400 }
    );
  }

  try {
    // Normal balance isn't a user choice — it's dictated by the nature of the
    // account group this ledger sits under (asset/expense = debit,
    // liability/equity/revenue = credit).
    const subGroup = await prisma.accountSubGroup.findFirst({
      where: { id: Number(accountSubGroupId), accountGroup: { companyId: ctx.companyId } },
      include: { accountGroup: true },
    });
    if (!subGroup) {
      return NextResponse.json({ error: "Account sub-group not found." }, { status: 400 });
    }
    const normalBalance: "DEBIT" | "CREDIT" =
      subGroup.accountGroup.type === "ASSET" || subGroup.accountGroup.type === "EXPENSE"
        ? "DEBIT"
        : "CREDIT";

    const ledger = await prisma.generalLedger.create({
      data: {
        // trg_sync_gl_company overwrites this from accountSubGroupId's
        // own AccountGroup, so this only needs to satisfy the required
        // field on the create input.
        companyId: ctx.companyId,
        code,
        name,
        accountSubGroupId: Number(accountSubGroupId),
        normalBalance,
        glType: glType ?? "OTHER",
        parentId: parentId ? Number(parentId) : null,
        isCashOrBank: Boolean(isCashOrBank),
        postsToCashBook: Boolean(postsToCashBook),
        requiresSubLedger: Boolean(requiresSubLedger),
        allowDocAdjust: Boolean(allowDocAdjust),
        isActive: typeof isActive === "boolean" ? isActive : true,
      },
    });
    return NextResponse.json(ledger, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create general ledger.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
