import { accountGroupInputSchema } from "@ntcas/shared";
import { expect, it } from "vitest";
import { accountGroup, accountSubGroup } from "../../db/schema";
import { describeCrud, describeSchemaDrift } from "../../test/crudSuite";

describeSchemaDrift(
  "account group",
  accountGroup,
  accountGroupInputSchema,
  { type: "ASSET", code: "A", description: "N" },
  [["code", 10], ["description", 50]],
  { companyId: 1, updatedAt: "2026-01-01", type: "ASSET", code: "A", description: "N" },
);

describeCrud({
  title: "account groups",
  path: "/api/account-groups",
  table: accountGroup,
  make: (n, over = {}) => ({ type: "ASSET", code: `AG-${n}`, description: `Account group ${n}`, ...over }),
  invalid: { body: { type: "FOO", code: "", description: "x".repeat(51) }, fields: ["type", "code", "description"] },
  unique: [
    { field: "code", clash: (e) => ({ code: e.code }), message: "A group with that code already exists." },
    { field: "description", clash: (e) => ({ description: e.description }), message: "A group with that description already exists." },
  ],
  searchOf: (r) => String(r.description),
  update: (n) => ({ body: { description: `Renamed group ${n}`, type: "LIABILITY" }, expect: { description: `Renamed group ${n}`, type: "LIABILITY" } }),
  sortKey: "code",
  extra: ({ h, create }) => {
    it("requires a type and accepts each of the five account types", async () => {
      const missing = await h().as("admin").post("/api/account-groups", { code: "AT-0", description: "No type" });
      expect(missing.status).toBe(400);
      expect(missing.body.error.details.fieldErrors.type).toEqual(["Account type is required"]);
      for (const [i, type] of (["ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE"] as const).entries()) {
        expect((await create({ type, code: `AT-${i + 1}`, description: `Type ${type}` })).type).toBe(type);
      }
    });

    it("refuses to delete a group that has sub-groups, then allows it once they are gone", async () => {
      h().onClose(async (companyIds) => {
        const { inArray } = await import("drizzle-orm");
        const ids = (await h().db.select({ id: accountGroup.id }).from(accountGroup).where(inArray(accountGroup.companyId, companyIds))).map((r) => r.id);
        if (ids.length) await h().db.delete(accountSubGroup).where(inArray(accountSubGroup.accountGroupId, ids));
      });
      const g = await create({ type: "ASSET", code: "AD-1", description: "Group with children" });
      const sub = (await h().as("admin").post("/api/account-sub-groups", { accountGroupId: g.id, code: "ADS-1", description: "Child" })).body;
      const blocked = await h().as("admin").delete(`/api/account-groups/${g.id}`);
      expect(blocked.status).toBe(409);
      expect(blocked.body.error.message).toBe("Cannot delete: this group has 1 sub-group(s). Delete or reassign them first.");
      expect((await h().as("admin").get(`/api/account-groups/${g.id}`)).body).toMatchObject({ subGroupsCount: 1, ledgersCount: 0 });
      expect((await h().as("admin").delete(`/api/account-sub-groups/${sub.id}`)).status).toBe(204);
      expect((await h().as("admin").delete(`/api/account-groups/${g.id}`)).status).toBe(204);
    });
  },
});
