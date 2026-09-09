import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// Forces Next.js to treat this route as completely dynamic, stopping it
// from running database queries during the build process.
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const agent = await prisma.agent.findUnique({
    where: { id: Number(id) },
    include: {
      _count: {
        select: {
          generalLedgers: true,
          parties: true,
          journalVoucherLines: true,
          cashBankVoucherLines: true,
        },
      },
    },
  });
  if (!agent) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(agent);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { code, name, phone, isActive } = body ?? {};

  try {
    const agent = await prisma.agent.update({
      where: { id: Number(id) },
      data: {
        code,
        name,
        phone: phone === undefined ? undefined : phone || null,
        isActive,
      },
    });
    return NextResponse.json(agent);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json(
        { error: "An agent with that code already exists." },
        { status: 409 }
      );
    }
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return NextResponse.json({ error: "Agent not found." }, { status: 404 });
    }
    const message = err instanceof Error ? err.message : "Failed to update agent.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const agentId = Number(id);

  try {
    // Agent is referenced with onDelete: SetNull on GeneralLedger, Party,
    // JournalVoucherLine, and CashBankVoucherLine — so deleting an agent
    // simply unlinks it from those records rather than being blocked.
    await prisma.agent.delete({ where: { id: agentId } });
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return NextResponse.json({ error: "Agent not found." }, { status: 404 });
    }
    const message = err instanceof Error ? err.message : "Failed to delete agent.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
