import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { requireCompanyId } from "@/lib/companyContext";

export const dynamic = "force-dynamic";

export async function GET() {
  const ctx = await requireCompanyId();
  if (!ctx.ok) return NextResponse.json({ error: "No company selected." }, { status: 400 });

  const subGroups = await prisma.productSubGroup.findMany({
    where: { productGroup: { companyId: ctx.companyId } },
    orderBy: { code: "asc" },
    include: { productGroup: true, _count: { select: { products: true } } },
  });
  return NextResponse.json(subGroups);
}

export async function POST(req: NextRequest) {
  const ctx = await requireCompanyId();
  if (!ctx.ok) return NextResponse.json({ error: "No company selected." }, { status: 400 });

  const body = await req.json();
  const { productGroupId, code, name, isActive } = body ?? {};

  if (!productGroupId || !code || !name) {
    return NextResponse.json(
      { error: "Product Group, Code, and Name are required." },
      { status: 400 }
    );
  }

  const parentGroup = await prisma.productGroup.findFirst({
    where: { id: Number(productGroupId), companyId: ctx.companyId },
  });
  if (!parentGroup) {
    return NextResponse.json({ error: "Product group not found." }, { status: 400 });
  }

  try {
    const subGroup = await prisma.productSubGroup.create({
      data: {
        productGroupId: Number(productGroupId),
        code,
        name,
        isActive: typeof isActive === "boolean" ? isActive : true,
      },
    });
    return NextResponse.json(subGroup, { status: 201 });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json(
        { error: "A sub-group with that code or name already exists in this group." },
        { status: 409 }
      );
    }
    const message = err instanceof Error ? err.message : "Failed to create product sub-group.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
