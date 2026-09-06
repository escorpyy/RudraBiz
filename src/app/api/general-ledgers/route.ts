export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET() {
  const ledgers = await prisma.generalLedger.findMany({
    orderBy: { code: "asc" },
    include: {
      accountSubGroup: { include: { accountGroup: true } },
      parent: { select: { id: true, name: true } },
    },
  });
  return NextResponse.json(ledgers);
}

export async function POST(req: NextRequest) {
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

  if (!code || !name || !accountSubGroupId || !normalBalance) {
    return NextResponse.json(
      { error: "Code, Name, Account Sub-Group, and Normal Balance are required." },
      { status: 400 }
    );
  }

  try {
    const ledger = await prisma.generalLedger.create({
      data: {
        code,
        name,
        accountSubGroupId: Number(accountSubGroupId),
        normalBalance,
        glType: glType ?? "OTHER",
        parentId: parentId ? Number(parentId) : null,
        isCashOrBank: !!isCashOrBank,
        postsToCashBook: !!postsToCashBook,
        requiresSubLedger: !!requiresSubLedger,
        allowDocAdjust: !!allowDocAdjust,
        isActive: isActive ?? true,
        subAreaId: subAreaId ? Number(subAreaId) : null,
        agentId: agentId ? Number(agentId) : null,
      },
    });
    return NextResponse.json(ledger, { status: 201 });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json(
        { error: "A general ledger with that code already exists." },
        { status: 409 }
      );
    }
    console.error(err);
    return NextResponse.json({ error: "Failed to create general ledger." }, { status: 500 });
  }
}
