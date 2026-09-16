import { Prisma } from "@prisma/client";

/**
 * Maps branch write failures to messages a user can act on.
 *
 * "One head office per company" and the per-company uniqueness of code/name
 * are enforced by indexes added in the multi-tenant migration — the head
 * office rule is a *partial* unique index, which Prisma can't express
 * declaratively, so it can surface either as P2002 or as a raw constraint
 * error depending on the path. Both are handled.
 *
 * Lives here rather than in a `route.ts` because Next.js only permits route
 * handlers and a small set of config exports from those files.
 */
export function describeBranchError(err: unknown): string {
  if (err instanceof Error && err.message.includes("Branch_only_one_head_office_per_company")) {
    return "This company already has a head office. Clear the existing one first.";
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
    const target = String(err.meta?.target ?? "");
    if (target.includes("isHeadOffice") || target.includes("head_office")) {
      return "This company already has a head office. Clear the existing one first.";
    }
    if (target.includes("name")) {
      return "A branch with that name already exists in this company.";
    }
    return "A branch with that code already exists in this company.";
  }
  console.error(err);
  return "Failed to save branch.";
}
