import { Router } from "express";
import { and, asc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { z } from "zod";
import { companyInputSchema, companyUpdateSchema, masterListQuerySchema, type CompanyDetail, type CompanyRow } from "@ntcas/shared";
import { accessByCompany, isAnyCompanyAdmin, requireCompanyAdmin } from "../../auth/companyAccess";
import type { Db } from "../../db/client";
import { withTx } from "../../db/tx";
import { branch, company, fiscalYear, userCompanyAccess } from "../../db/schema";
import { forbidden, notFound, conflict } from "../../http/errors";
import { orConflict } from "../../http/pg";
import { validate } from "../../http/validate";

const idParams = z.object({ id: z.coerce.number().int().positive() });

const columns = {
  id: company.id,
  code: company.code,
  name: company.name,
  legalName: company.legalName,
  businessType: company.businessType,
  registrationNo: company.registrationNo,
  panNo: company.panNo,
  vatNo: company.vatNo,
  isVatRegistered: company.isVatRegistered,
  taxOfficeName: company.taxOfficeName,
  address: company.address,
  city: company.city,
  district: company.district,
  province: company.province,
  country: company.country,
  phone: company.phone,
  email: company.email,
  website: company.website,
  baseCurrency: company.baseCurrency,
  defaultCalendarPref: company.defaultCalendarPref,
  isActive: company.isActive,
  branchesCount: sql<number>`(select count(*)::int from "Branch" b where b."companyId" = "Company"."id")`,
  fiscalYearsCount: sql<number>`(select count(*)::int from "FiscalYear" f where f."companyId" = "Company"."id")`,
};

/** What still hangs off a company and blocks deleting it (same list and wording as the legacy app). */
const BLOCKERS: { table: string; label: string; plural: string }[] = [
  { table: "AccountGroup", label: "account group", plural: "account groups" },
  { table: "GeneralLedger", label: "general ledger", plural: "general ledgers" },
  { table: "Party", label: "party", plural: "parties" },
  { table: "Product", label: "product", plural: "products" },
  { table: "FiscalYear", label: "fiscal year", plural: "fiscal years" },
  { table: "JournalVoucher", label: "journal voucher", plural: "journal vouchers" },
  { table: "CashBankVoucher", label: "cash/bank voucher", plural: "cash/bank vouchers" },
  { table: "OpeningBalance", label: "opening balance", plural: "opening balances" },
];

/**
 * Company master: the tenant registry. Unlike every other master it is NOT scoped to the selected
 * company (it is what fills the company switcher), so access comes from the user's own access rows:
 * you see the companies you have access to, and only a company-wide ADMIN can change or delete one.
 * Creating a company also creates its head-office branch and makes the creator its ADMIN.
 */
export function companiesRouter(db: Db) {
  const r = Router();

  async function find(userId: number, id: number): Promise<CompanyRow | undefined> {
    const access = (await accessByCompany(db, userId)).get(id);
    if (!access) return undefined;
    const [row] = await db.select(columns).from(company).where(eq(company.id, id));
    return row ? ({ ...row, role: access.role } as CompanyRow) : undefined;
  }

  r.get("/", validate({ query: masterListQuerySchema }), async (req, res) => {
    const { status, q } = req.valid.query as z.infer<typeof masterListQuerySchema>;
    const access = await accessByCompany(db, req.appUser.id);
    const ids = [...access.keys()];
    if (!ids.length) return res.json([]);
    const rows = await db
      .select(columns)
      .from(company)
      .where(
        and(
          inArray(company.id, ids),
          status === "active" ? eq(company.isActive, true) : undefined,
          q ? or(ilike(company.code, `%${q}%`), ilike(company.name, `%${q}%`), ilike(company.legalName, `%${q}%`)) : undefined,
        ),
      )
      .orderBy(asc(company.name));
    res.json(rows.map((c) => ({ ...c, role: access.get(c.id)!.role })));
  });

  r.get("/:id", validate({ params: idParams }), async (req, res) => {
    const { id } = req.valid.params as z.infer<typeof idParams>;
    const row = await find(req.appUser.id, id);
    if (!row) throw notFound("Company");
    const branches = await db
      .select({ id: branch.id, code: branch.code, name: branch.name, isHeadOffice: branch.isHeadOffice, isActive: branch.isActive })
      .from(branch)
      .where(eq(branch.companyId, id))
      .orderBy(sql`${branch.isHeadOffice} desc`, asc(branch.name));
    const fiscalYears = await db
      .select({ id: fiscalYear.id, code: fiscalYear.code, isCurrent: fiscalYear.isCurrent, isClosed: fiscalYear.isClosed })
      .from(fiscalYear)
      .where(eq(fiscalYear.companyId, id))
      .orderBy(sql`${fiscalYear.startDate} desc`);
    const detail: CompanyDetail = { ...row, branches, fiscalYears };
    res.json(detail);
  });

  r.post("/", validate({ body: companyInputSchema }), async (req, res) => {
    if (!(await isAnyCompanyAdmin(db, req.appUser.id))) throw forbidden("Only a company administrator can create companies");
    const body = req.valid.body as z.infer<typeof companyInputSchema>;
    const id = await orConflict(
      [{ constraint: "Company_code_key", field: "code", message: "A company with that code already exists." }],
      () =>
        withTx(db, req.appUser.id, async (tx) => {
          const [c] = await tx
            .insert(company)
            .values({ ...body, updatedAt: sql`CURRENT_TIMESTAMP` } as never)
            .returning({ id: company.id });
          // a company with no branch is unusable (vouchers need one), so it always starts with a head office
          await tx.insert(branch).values({
            companyId: c!.id,
            code: "HO",
            name: "Head Office",
            isHeadOffice: true,
            address: body.address,
            phone: body.phone,
            email: body.email,
            updatedAt: sql`CURRENT_TIMESTAMP`,
          } as never);
          await tx.insert(userCompanyAccess).values({ userId: req.appUser.id, companyId: c!.id, branchId: null, role: "ADMIN" });
          return c!.id;
        }),
    );
    res.status(201).json(await find(req.appUser.id, id));
  });

  r.patch("/:id", validate({ params: idParams, body: companyUpdateSchema }), async (req, res) => {
    const { id } = req.valid.params as z.infer<typeof idParams>;
    await requireCompanyAdmin(db, req.appUser.id, id);
    await orConflict(
      [{ constraint: "Company_code_key", field: "code", message: "A company with that code already exists." }],
      () =>
        withTx(db, req.appUser.id, async (tx) => {
          const updated = await tx
            .update(company)
            .set({ ...(req.valid.body as object), updatedAt: sql`CURRENT_TIMESTAMP` } as never)
            .where(eq(company.id, id))
            .returning({ id: company.id });
          if (!updated.length) throw notFound("Company");
        }),
    );
    res.json(await find(req.appUser.id, id));
  });

  r.delete("/:id", validate({ params: idParams }), async (req, res) => {
    const { id } = req.valid.params as z.infer<typeof idParams>;
    await requireCompanyAdmin(db, req.appUser.id, id);
    const counts = await db.execute(
      sql.raw(`select ${BLOCKERS.map((b) => `(select count(*)::int from "${b.table}" where "companyId" = ${id}) as "${b.table}"`).join(", ")}`),
    );
    const row = counts.rows[0] as Record<string, number>;
    const found = BLOCKERS.filter((b) => row[b.table]! > 0).map((b) => `${row[b.table]} ${row[b.table] === 1 ? b.label : b.plural}`);
    if (found.length) {
      throw conflict(`Cannot delete: this company still has ${found.join(", ")}. Deactivate it instead, or remove those records first.`);
    }
    // branches and access rows are the company's own scaffolding, removed with it
    await withTx(db, req.appUser.id, async (tx) => {
      await tx.delete(userCompanyAccess).where(eq(userCompanyAccess.companyId, id));
      await tx.delete(branch).where(eq(branch.companyId, id));
      await tx.delete(company).where(eq(company.id, id));
    });
    res.status(204).end();
  });

  return r;
}
