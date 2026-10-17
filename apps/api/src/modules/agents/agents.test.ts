import { describe, expect, it } from "vitest";
import { agentInputSchema } from "@ntcas/shared";
import { agent } from "../../db/schema";
import { describeCrud, describeSchemaDrift } from "../../test/crudSuite";

describeSchemaDrift(
  "agent",
  agent,
  agentInputSchema,
  { code: "A", name: "N" },
  [["code", 10], ["name", 100], ["phone", 25]],
  { companyId: 1, updatedAt: "2026-01-01", code: "A", name: "N" },
);

describe("agent input rules", () => {
  it("turns an empty phone into null and trims", () => {
    expect(agentInputSchema.parse({ code: " AG-1 ", name: " Ram ", phone: "  " })).toEqual({ code: "AG-1", name: "Ram", phone: null, isActive: true });
  });
});

describeCrud({
  title: "agents",
  path: "/api/agents",
  table: agent,
  make: (n, over = {}) => ({ code: `AG-${n}`, name: `Agent number ${n}`, phone: null, ...over }),
  invalid: { body: { code: "", name: "", phone: "9".repeat(30) }, fields: ["code", "name", "phone"] },
  unique: [{ field: "code", clash: (e) => ({ code: e.code }), message: "An agent with that code already exists." }],
  searchOf: (r) => String(r.name),
  update: (n) => ({ body: { name: `Renamed agent ${n}`, phone: "" }, expect: { name: `Renamed agent ${n}`, phone: null } }),
});
