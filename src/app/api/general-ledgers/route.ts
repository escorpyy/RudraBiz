import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const ledgers = await prisma.generalLedger.findMany({
    where: { isActive: true },
    orderBy: { code: "asc" },
    select: { id: true, code: true, name: true },
  });
  return NextResponse.json(ledgers);
}

export async function POST(req: NextRequest) {
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
    const subGroup = await prisma.accountSubGroup.findUnique({
      where: { id: Number(accountSubGroupId) },
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
