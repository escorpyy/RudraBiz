import { areaInputSchema } from "@ntcas/shared";
import { expect, it } from "vitest";
import { inArray, sql } from "drizzle-orm";
import { area, subArea } from "../../db/schema";
import { describeCrud, describeSchemaDrift } from "../../test/crudSuite";

describeSchemaDrift(
  "area",
  area,
  areaInputSchema,
  { code: "A", name: "N", shortName: "S" },
  [["code", 10], ["name", 50], ["shortName", 10]],
  { companyId: 1, updatedAt: "2026-01-01", code: "A", name: "N", shortName: "S" },
);

describeCrud({
  title: "areas",
  path: "/api/areas",
  table: area,
  make: (n, over = {}) => ({ code: `AR-${n}`, name: `Area ${n}`, shortName: `A${n}`, ...over }),
  invalid: { body: { code: "", name: "x".repeat(51), shortName: "" }, fields: ["code", "name", "shortName"] },
  unique: [
    { field: "code", clash: (e) => ({ code: e.code }), message: "An area with that code already exists." },
    { field: "name", clash: (e) => ({ name: e.name }), message: "An area with that name already exists." },
    { field: "shortName", clash: (e) => ({ shortName: e.shortName }), message: "An area with that short name already exists." },
  ],
  searchOf: (r) => String(r.name),
  update: (n) => ({ body: { name: `Renamed area ${n}` }, expect: { name: `Renamed area ${n}` } }),
  extra: ({ h, create }) => {
    it("refuses to delete an area that has sub-areas, then allows it once they are gone", async () => {
      h().onClose(async (companyIds) => {
        const ids = (await h().db.select({ id: area.id }).from(area).where(inArray(area.companyId, companyIds))).map((r) => r.id);
        if (ids.length) await h().db.delete(subArea).where(inArray(subArea.areaId, ids));
      });
      const a = await create({ code: "ARD-1", name: "Area with children", shortName: "AWC" });
      const [s] = await h().db
        .insert(subArea)
        .values({ code: "S1", name: "Sub 1", shortName: "S1", areaId: a.id, updatedAt: sql`CURRENT_TIMESTAMP` as never })
        .returning({ id: subArea.id });

      const blocked = await h().as("admin").delete(`/api/areas/${a.id}`);
      expect(blocked.status).toBe(409);
      expect(blocked.body.error.message).toBe("Cannot delete: this area has 1 sub-area(s). Delete or reassign them first.");
      expect((await h().as("admin").get(`/api/areas/${a.id}`)).body.subAreasCount).toBe(1);

      await h().db.delete(subArea).where(sql`id = ${s!.id}`);
      expect((await h().as("admin").delete(`/api/areas/${a.id}`)).status).toBe(204);
    });
  },
});
