import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCompanyId } from "@/lib/companyContext";

export const dynamic = "force-dynamic";

export async function GET() {
  const ctx = await requireCompanyId();
  if (!ctx.ok) return NextResponse.json({ error: "No company selected." }, { status: 400 });

  const subGroups = await prisma.accountSubGroup.findMany({
    where: { isActive: true, accountGroup: { companyId: ctx.companyId } },
    orderBy: { code: "asc" },
    include: { accountGroup: true },
  });

  const rows = subGroups.map((sg) => ({
    id: sg.id,
    code: sg.code,
    name: sg.description,
    accountGroup: { name: sg.accountGroup.description },
  }));

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const ctx = await requireCompanyId();
  if (!ctx.ok) return NextResponse.json({ error: "No company selected." }, { status: 400 });

  const body = await req.json();
  const { accountGroupId, code, description, isActive } = body ?? {};

  if (!accountGroupId || !code || !description) {
    return NextResponse.json(
      { error: "accountGroupId, code, and description are required." },
      { status: 400 }
    );
  }

  const parentGroup = await prisma.accountGroup.findFirst({
    where: { id: Number(accountGroupId), companyId: ctx.companyId },
  });
  if (!parentGroup) {
    return NextResponse.json({ error: "Account group not found." }, { status: 400 });
  }

  try {
    const subGroup = await prisma.accountSubGroup.create({
      data: {
        accountGroupId: Number(accountGroupId),
        code,
        description,
        isActive: typeof isActive === "boolean" ? isActive : true,
      },
    });
    return NextResponse.json(subGroup, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create account sub-group.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
