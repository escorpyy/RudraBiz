import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

// Also feeds the Stock Category picker on the Product form (Stock detail).
export async function GET() {
  const categories = await prisma.stockCategory.findMany({
    orderBy: { code: "asc" },
    include: { _count: { select: { stockDetails: true } } },
  });
  return NextResponse.json(categories);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { code, name, isActive } = body ?? {};

  if (!code || !name) {
    return NextResponse.json({ error: "Code and Name are required." }, { status: 400 });
  }

  try {
    const category = await prisma.stockCategory.create({
      data: { code, name, isActive: typeof isActive === "boolean" ? isActive : true },
    });
    return NextResponse.json(category, { status: 201 });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json(
        { error: "A stock category with that code or name already exists." },
        { status: 409 }
      );
    }
    const message = err instanceof Error ? err.message : "Failed to create stock category.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
