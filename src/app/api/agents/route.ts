import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

// Feeds simple "select an agent" dropdowns (e.g. on the Party form) as well
// as the Agent Master UI list, which reads active + inactive agents
// directly via prisma in the page component — this route stays scoped to
// the active-only, minimal-fields shape the dropdowns expect.
export async function GET() {
  const agents = await prisma.agent.findMany({
    where: { isActive: true },
    orderBy: { code: "asc" },
    select: { id: true, code: true, name: true },
  });
  return NextResponse.json(agents);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { code, name, phone, isActive } = body ?? {};

  if (!code || !name) {
    return NextResponse.json(
      { error: "code and name are required." },
      { status: 400 }
    );
  }

  try {
    const agent = await prisma.agent.create({
      data: {
        code,
        name,
        phone: phone || null,
        isActive: typeof isActive === "boolean" ? isActive : true,
      },
    });
    return NextResponse.json(agent, { status: 201 });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json(
        { error: "An agent with that code already exists." },
        { status: 409 }
      );
    }
    console.error(err);
    return NextResponse.json({ error: "Failed to create agent." }, { status: 500 });
  }
}
