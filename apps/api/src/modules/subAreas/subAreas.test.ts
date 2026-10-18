import { subAreaInputSchema } from "@ntcas/shared";
import { expect, it } from "vitest";
import { area, subArea } from "../../db/schema";
import { describeCrud, describeSchemaDrift } from "../../test/crudSuite";

describeSchemaDrift(
  "sub-area",
  subArea,
  subAreaInputSchema,
  { areaId: 1, code: "A", name: "N", shortName: "S" },
  [["code", 10], ["name", 50], ["shortName", 10]],
  { areaId: 1, updatedAt: "2026-01-01", code: "A", name: "N", shortName: "S" },
);

describeCrud({
  title: "sub-areas",
  path: "/api/sub-areas",
  table: subArea,
  parent: { path: "/api/areas", table: area, field: "areaId", make: (n) => ({ code: `PA-${n}`, name: `Parent area ${n}`, shortName: `PA${n}` }) },
  make: (n, over = {}) => ({ code: `SA-${n}`, name: `Sub-area ${n}`, shortName: `S${n}`, ...over }),
  invalid: { body: { code: "", name: "x".repeat(51), shortName: "x".repeat(11) }, fields: ["code", "name", "shortName"] },
  unique: [
    { field: "code", clash: (e) => ({ code: e.code }), message: "A sub-area with that code already exists in this area." },
    { field: "name", clash: (e) => ({ name: e.name }), message: "A sub-area with that name already exists in this area." },
    { field: "shortName", clash: (e) => ({ shortName: e.shortName }), message: "A sub-area with that short name already exists in this area." },
  ],
  searchOf: (r) => String(r.name),
  update: (n) => ({ body: { name: `Renamed sub-area ${n}` }, expect: { name: `Renamed sub-area ${n}` } }),
  extra: ({ h, create, parents }) => {
    it("shows the area name, and a code may repeat under a different area of the same company", async () => {
      const first = await create({ code: "SX-1", name: "Sub X1", shortName: "SX1" });
      expect(first).toMatchObject({ areaId: parents().A.id, areaName: parents().A.name, ledgersCount: 0, partiesCount: 0 });
      const other = (await h().as("admin").post("/api/areas", { code: "PA-OTH", name: "Second area", shortName: "OTH" })).body;
      const again = await h().as("admin").post("/api/sub-areas", { areaId: other.id, code: "SX-1", name: "Sub X1", shortName: "SX1" });
      expect(again.status).toBe(201);
      const moved = await h().as("admin").patch(`/api/sub-areas/${first.id}`, { areaId: other.id });
      expect(moved.status).toBe(409); // now clashes with the copy already under that area
      expect(moved.body.error.details.field).toBe("code");
    });

    it("rejects an area that is missing or belongs to another company, on the areaId field", async () => {
      const mine = await create({ code: "SY-1", name: "Sub Y1", shortName: "SY1" });
      for (const areaId of [999999999, parents().B.id]) {
        const post = await h().as("admin").post("/api/sub-areas", { areaId, code: "SY-2", name: "Sub Y2", shortName: "SY2" });
        expect(post.status).toBe(400);
        expect(post.body.error.details.fieldErrors.areaId).toEqual(["Area not found."]);
        const patch = await h().as("admin").patch(`/api/sub-areas/${mine.id}`, { areaId });
        expect(patch.status).toBe(400);
        expect(patch.body.error.details.fieldErrors.areaId).toBeDefined();
      }
      const missing = await h().as("admin").post("/api/sub-areas", { code: "SY-3", name: "Sub Y3", shortName: "SY3" });
      expect(missing.status).toBe(400);
      expect(missing.body.error.details.fieldErrors.areaId).toBeDefined();
    });

    it("blocks deleting an area that still has sub-areas (area guard sees them)", async () => {
      const s = await create({ code: "SZ-1", name: "Sub Z1", shortName: "SZ1" });
      const blocked = await h().as("admin").delete(`/api/areas/${parents().A.id}`);
      expect(blocked.status).toBe(409);
      expect(blocked.body.error.message).toMatch(/sub-area\(s\)/);
      expect((await h().as("admin").delete(`/api/sub-areas/${s.id}`)).status).toBe(204);
    });
  },
});
