import { stockCategoryInputSchema } from "@ntcas/shared";
import { stockCategory } from "../../db/schema";
import { describeCrud, describeSchemaDrift } from "../../test/crudSuite";

describeSchemaDrift(
  "stock category",
  stockCategory,
  stockCategoryInputSchema,
  { code: "A", name: "N" },
  [["code", 10], ["name", 50]],
  { companyId: 1, updatedAt: "2026-01-01", code: "A", name: "N" },
);

describeCrud({
  title: "stock categories",
  path: "/api/stock-categories",
  table: stockCategory,
  make: (n, over = {}) => ({ code: `SC-${n}`, name: `Stock category ${n}`, ...over }),
  invalid: { body: { code: "", name: "x".repeat(51) }, fields: ["code", "name"] },
  unique: [
    { field: "code", clash: (e) => ({ code: e.code }), message: "A stock category with that code already exists." },
    { field: "name", clash: (e) => ({ name: e.name }), message: "A stock category with that name already exists." },
  ],
  searchOf: (r) => String(r.name),
  update: (n) => ({ body: { name: `Renamed category ${n}` }, expect: { name: `Renamed category ${n}` } }),
});
