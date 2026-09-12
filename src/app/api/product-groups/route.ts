import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

// Also feeds the cascading Product Group -> Product Sub-Group picker on
// the Product form, the same way /api/account-groups feeds the Account
// Group -> Sub-Group picker on the Party/GL forms.
export async function GET() {
  const groups = await prisma.productGroup.findMany({
    orderBy: { code: "asc" },
    include: { subGroups: { orderBy: { code: "asc" }, include: { _count: { select: { products: true } } } } },
  });
  return NextResponse.json(groups);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { code, name, isActive } = body ?? {};

  if (!code || !name) {
    return NextResponse.json({ error: "Code and Name are required." }, { status: 400 });
  }

  try {
    const group = await prisma.productGroup.create({
      data: { code, name, isActive: typeof isActive === "boolean" ? isActive : true },
    });
    return NextResponse.json(group, { status: 201 });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json({ error: "A product group with that code or name already exists." }, { status: 409 });
    }
    const message = err instanceof Error ? err.message : "Failed to create product group.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
