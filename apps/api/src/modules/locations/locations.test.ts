import { locationInputSchema } from "@ntcas/shared";
import { eq, inArray } from "drizzle-orm";
import { expect, it } from "vitest";
import { location } from "../../db/schema";
import { describeCrud, describeSchemaDrift } from "../../test/crudSuite";

describeSchemaDrift(
  "location",
  location,
  locationInputSchema,
  { code: "A", name: "N" },
  [["code", 10], ["name", 50]],
  { companyId: 1, updatedAt: "2026-01-01", code: "A", name: "N" },
);

describeCrud({
  title: "locations",
  path: "/api/locations",
  table: location,
  make: (n, over = {}) => ({ code: `L-${n}`, name: `Location ${n}`, ...over }),
  invalid: { body: { code: "", name: "x".repeat(51) }, fields: ["code", "name"] },
  unique: [{ field: "code", clash: (e) => ({ code: e.code }), message: "A location with that code already exists." }],
  searchOf: (r) => String(r.name),
  update: (n) => ({ body: { name: `Renamed location ${n}` }, expect: { name: `Renamed location ${n}` } }),
  extra: ({ h, create }) => {
    // parents are RESTRICT-protected: detach everything first so the generic cleanup can delete rows in any order
    let hooked = false;
    const hook = () => {
      if (hooked) return;
      hooked = true;
      h().onClose((companyIds) => h().db.update(location).set({ parentId: null }).where(inArray(location.companyId, companyIds)));
    };
    const as = () => h().as("admin");

    it("nests a location under a parent and reports names and counts", async () => {
      hook();
      const root = await create({ code: "LP-1", name: "Warehouse" });
      const child = await create({ code: "LP-2", name: "Shelf A", parentId: root.id });
      expect(child).toMatchObject({ parentId: root.id, parentName: "Warehouse", childrenCount: 0 });
      expect((await as().get(`/api/locations/${root.id}`)).body.childrenCount).toBe(1);
      const cleared = await as().patch(`/api/locations/${child.id}`, { parentId: null });
      expect(cleared.body).toMatchObject({ parentId: null, parentName: null });
    });

    it("rejects a missing parent, another company's parent, itself and its own descendant on parentId", async () => {
      hook();
      const a = await create({ code: "LR-1", name: "Root R" });
      const b = await create({ code: "LR-2", name: "Child R", parentId: a.id });
      const c = await create({ code: "LR-3", name: "Grandchild R", parentId: b.id });
      const other = (await h().as("adminB").post("/api/locations", { code: "LR-X", name: "Other company" })).body;

      const cases: [string, number, number | string][] = [
        ["missing parent", a.id, 999999999],
        ["another company's parent", a.id, other.id],
        ["itself", a.id, a.id],
        ["its own child", a.id, b.id],
        ["its own grandchild", a.id, c.id],
      ];
      for (const [label, target, parentId] of cases) {
        const res = await as().patch(`/api/locations/${target}`, { parentId });
        expect(res.status, label).toBe(400);
        expect(res.body.error.details.fieldErrors.parentId, label).toBeDefined();
      }
      const onCreate = await as().post("/api/locations", { code: "LR-4", name: "Orphan", parentId: other.id });
      expect(onCreate.status).toBe(400);
      expect(await h().db.select().from(location).where(eq(location.code, "LR-4"))).toHaveLength(0);
    });

    it("refuses to delete a location with children, then allows it once they are gone", async () => {
      hook();
      const root = await create({ code: "LD-1", name: "Delete parent" });
      const child = await create({ code: "LD-2", name: "Delete child", parentId: root.id });
      const blocked = await as().delete(`/api/locations/${root.id}`);
      expect(blocked.status).toBe(409);
      expect(blocked.body.error.message).toBe("Cannot delete: this location has 1 child location(s). Delete or reassign them first.");
      expect((await as().delete(`/api/locations/${child.id}`)).status).toBe(204);
      expect((await as().delete(`/api/locations/${root.id}`)).status).toBe(204);
    });
  },
});
