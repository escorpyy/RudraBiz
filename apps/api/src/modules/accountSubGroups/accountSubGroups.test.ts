import { accountSubGroupInputSchema } from "@ntcas/shared";
import { expect, it } from "vitest";
import { accountGroup, accountSubGroup } from "../../db/schema";
import { describeCrud, describeSchemaDrift } from "../../test/crudSuite";

describeSchemaDrift(
  "account sub-group",
  accountSubGroup,
  accountSubGroupInputSchema,
  { accountGroupId: 1, code: "A", description: "N" },
  [["code", 10], ["description", 50]],
  { accountGroupId: 1, updatedAt: "2026-01-01", code: "A", description: "N" },
);

describeCrud({
  title: "account sub-groups",
  path: "/api/account-sub-groups",
  table: accountSubGroup,
  parent: { path: "/api/account-groups", table: accountGroup, field: "accountGroupId", make: (n) => ({ type: "EXPENSE", code: `PAG-${n}`, description: `Parent account group ${n}` }) },
  make: (n, over = {}) => ({ code: `ASG-${n}`, description: `Account sub-group ${n}`, ...over }),
  invalid: { body: { code: "", description: "x".repeat(51) }, fields: ["code", "description"] },
  unique: [
    { field: "code", clash: (e) => ({ code: e.code }), message: "A sub-group with that code already exists in this group." },
    { field: "description", clash: (e) => ({ description: e.description }), message: "A sub-group with that description already exists in this group." },
  ],
  searchOf: (r) => String(r.description),
  update: (n) => ({ body: { description: `Renamed sub-group ${n}` }, expect: { description: `Renamed sub-group ${n}` } }),
  extra: ({ h, create, parents }) => {
    it("shows the group's description and type, and a changed group type follows", async () => {
      const s = await create({ code: "ASX-1", description: "Sub X1" });
      expect(s).toMatchObject({ accountGroupId: parents().A.id, groupDescription: parents().A.description, groupType: "EXPENSE", ledgersCount: 0 });
      await h().as("admin").patch(`/api/account-groups/${parents().A.id}`, { type: "REVENUE" });
      expect((await h().as("admin").get(`/api/account-sub-groups/${s.id}`)).body.groupType).toBe("REVENUE");
    });

    it("rejects a group that is missing or belongs to another company, on the accountGroupId field", async () => {
      for (const accountGroupId of [999999999, parents().B.id]) {
        const res = await h().as("admin").post("/api/account-sub-groups", { accountGroupId, code: "ASY-1", description: "Sub Y1" });
        expect(res.status).toBe(400);
        expect(res.body.error.details.fieldErrors.accountGroupId).toEqual(["Account group not found."]);
      }
    });
  },
});
