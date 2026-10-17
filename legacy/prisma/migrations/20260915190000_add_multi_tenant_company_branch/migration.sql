-- ============================================================
-- MIGRATION: Multi-tenant Company + Branch + UserCompanyAccess
--
-- Converts Company from a single-row singleton into a normal
-- multi-row master table, adds Branch (scoped to Company) and
-- UserCompanyAccess, and threads companyId/branchId through every
-- table that needs to be scoped by the header switcher
-- (Company -> Branch -> Fiscal Year).
--
-- Hand-written because Prisma's declarative schema can't express:
--   - partial unique indexes (one CURRENT FiscalYear per company,
--     one HEAD OFFICE Branch per company)
--   - trigger-based FK consistency for denormalized companyId
--     columns (GeneralLedger, Party, OpeningBalance, JournalVoucher,
--     CashBankVoucher) and for Company.retainedEarningsGLId
-- ============================================================

-- ------------------------------------------------------------
-- ENUMS
-- ------------------------------------------------------------

CREATE TYPE "BusinessType" AS ENUM (
    'SOLE_PROPRIETORSHIP', 'PARTNERSHIP', 'PRIVATE_LIMITED', 'PUBLIC_LIMITED', 'OTHER'
);

CREATE TYPE "CompanyRole" AS ENUM ('ADMIN', 'ACCOUNTANT', 'VIEWER');

-- ------------------------------------------------------------
-- COMPANY — singleton -> normal multi-row master table
-- ------------------------------------------------------------

ALTER TABLE "Company" DROP CONSTRAINT "Company_singleton_check";

ALTER TABLE "Company"
    ADD COLUMN "code"                VARCHAR(15),
    ADD COLUMN "legalName"           VARCHAR(200),
    ADD COLUMN "businessType"        "BusinessType" NOT NULL DEFAULT 'OTHER',
    ADD COLUMN "registrationNo"      VARCHAR(50),
    ADD COLUMN "panNo"               VARCHAR(25),
    ADD COLUMN "vatNo"               VARCHAR(25),
    ADD COLUMN "isVatRegistered"     BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "taxOfficeName"       VARCHAR(100),
    ADD COLUMN "city"                VARCHAR(50),
    ADD COLUMN "district"            VARCHAR(50),
    ADD COLUMN "province"            VARCHAR(50),
    ADD COLUMN "country"             VARCHAR(50) DEFAULT 'Nepal',
    ADD COLUMN "website"             VARCHAR(255),
    ADD COLUMN "defaultCalendarPref" "CalendarPreference" NOT NULL DEFAULT 'BS',
    ADD COLUMN "isActive"            BOOLEAN NOT NULL DEFAULT true;

-- Carry forward the old single free-text pan/vat field into the new
-- dedicated panNo column (best-effort — the old field mixed both).
UPDATE "Company" SET "panNo" = "panOrVatNo" WHERE "panOrVatNo" IS NOT NULL;

ALTER TABLE "Company" DROP COLUMN "panOrVatNo";

-- Give any pre-existing singleton row a slug so the new unique
-- constraint below can be added.
UPDATE "Company" SET "code" = 'MAIN' WHERE "code" IS NULL;

ALTER TABLE "Company" ALTER COLUMN "code" SET NOT NULL;
ALTER TABLE "Company" ADD CONSTRAINT "Company_code_key" UNIQUE ("code");
CREATE INDEX "Company_isActive_idx" ON "Company"("isActive");

-- Every table below assumes at least one Company row to backfill
-- its new companyId column against. Create one if this is a fresh
-- database that never had the old singleton set up but already has
-- master data in it (or if it's genuinely empty, harmless either way
-- since nothing will reference it).
INSERT INTO "Company" ("code", "name", "businessType", "baseCurrency", "defaultCalendarPref", "isVatRegistered", "isActive", "createdAt", "updatedAt")
SELECT 'MAIN', 'Default Company', 'OTHER', 'NPR', 'BS', false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "Company");

-- ------------------------------------------------------------
-- BRANCH
-- ------------------------------------------------------------

CREATE TABLE "Branch" (
    "id"           SERIAL PRIMARY KEY,
    "companyId"    INTEGER NOT NULL,
    "code"         VARCHAR(15) NOT NULL,
    "name"         VARCHAR(100) NOT NULL,
    "isHeadOffice" BOOLEAN NOT NULL DEFAULT false,
    "address"      VARCHAR(300),
    "phone"        VARCHAR(20),
    "email"        VARCHAR(255),
    "isActive"     BOOLEAN NOT NULL DEFAULT true,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Branch_companyId_code_key" UNIQUE ("companyId", "code"),
    CONSTRAINT "Branch_companyId_name_key" UNIQUE ("companyId", "name"),

    CONSTRAINT "Branch_companyId_fkey"
        FOREIGN KEY ("companyId") REFERENCES "Company"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "Branch_companyId_idx" ON "Branch"("companyId");

-- Only one branch per company may be the head office. A plain
-- UNIQUE(companyId) would forbid a company from having more than one
-- branch at all, so this has to be a partial index scoped to
-- isHeadOffice = true, same pattern as FiscalYear.isCurrent.
CREATE UNIQUE INDEX "Branch_only_one_head_office_per_company"
    ON "Branch"("companyId")
    WHERE "isHeadOffice" = true;

-- Every company needs at least one branch for the header switcher
-- (and as a backfill target for the NOT NULL branchId columns added
-- below), so give every existing company a default Head Office.
INSERT INTO "Branch" ("companyId", "code", "name", "isHeadOffice", "isActive", "createdAt", "updatedAt")
SELECT c."id", 'HO', 'Head Office', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "Company" c
WHERE NOT EXISTS (SELECT 1 FROM "Branch" b WHERE b."companyId" = c."id");

-- ------------------------------------------------------------
-- USER <-> COMPANY ACCESS
-- ------------------------------------------------------------

CREATE TABLE "UserCompanyAccess" (
    "id"        SERIAL PRIMARY KEY,
    "userId"    INTEGER NOT NULL,
    "companyId" INTEGER NOT NULL,
    "branchId"  INTEGER,
    "role"      "CompanyRole" NOT NULL DEFAULT 'VIEWER',
    "isActive"  BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserCompanyAccess_userId_companyId_branchId_key" UNIQUE ("userId", "companyId", "branchId"),

    CONSTRAINT "UserCompanyAccess_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "User"("id")
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserCompanyAccess_companyId_fkey"
        FOREIGN KEY ("companyId") REFERENCES "Company"("id")
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserCompanyAccess_branchId_fkey"
        FOREIGN KEY ("branchId") REFERENCES "Branch"("id")
        ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "UserCompanyAccess_companyId_idx" ON "UserCompanyAccess"("companyId");
CREATE INDEX "UserCompanyAccess_branchId_idx" ON "UserCompanyAccess"("branchId");

-- Note: the plain UNIQUE(userId, companyId, branchId) above still lets
-- a user get two "All Branches" (branchId IS NULL) rows for the same
-- company, since Postgres treats each NULL as distinct in a composite
-- unique constraint. Deliberately left as-is (not tightened with a
-- partial index, unlike FiscalYear.isCurrent/Branch.isHeadOffice)
-- because this @@unique is one Prisma already declares and upserts
-- against directly — a partial index outside that declared constraint
-- would target a different conflict path than Prisma's own
-- INSERT ... ON CONFLICT and break upsert idempotency.

-- A user's branch-scoped access must be to a branch that actually
-- belongs to the company they're being granted access to — otherwise
-- the switcher could offer a branch under the wrong company.
CREATE OR REPLACE FUNCTION fn_check_uca_branch_company()
RETURNS TRIGGER AS $$
DECLARE
    v_branch_company_id INTEGER;
BEGIN
    IF NEW."branchId" IS NOT NULL THEN
        SELECT "companyId" INTO v_branch_company_id FROM "Branch" WHERE "id" = NEW."branchId";
        IF v_branch_company_id IS DISTINCT FROM NEW."companyId" THEN
            RAISE EXCEPTION 'UserCompanyAccess.branchId must belong to UserCompanyAccess.companyId';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_uca_branch_company
BEFORE INSERT OR UPDATE ON "UserCompanyAccess"
FOR EACH ROW EXECUTE FUNCTION fn_check_uca_branch_company();

-- ------------------------------------------------------------
-- FISCAL YEAR — scope to Company
-- ------------------------------------------------------------

ALTER TABLE "FiscalYear" ADD COLUMN "companyId" INTEGER;

UPDATE "FiscalYear" SET "companyId" = (SELECT "id" FROM "Company" ORDER BY "id" LIMIT 1)
WHERE "companyId" IS NULL;

ALTER TABLE "FiscalYear" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "FiscalYear" ADD CONSTRAINT "FiscalYear_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "FiscalYear" DROP CONSTRAINT "FiscalYear_code_key";
ALTER TABLE "FiscalYear" ADD CONSTRAINT "FiscalYear_companyId_code_key" UNIQUE ("companyId", "code");

DROP INDEX "FiscalYear_only_one_current";
DROP INDEX "FiscalYear_isCurrent_idx";

CREATE INDEX "FiscalYear_companyId_idx" ON "FiscalYear"("companyId");
CREATE INDEX "FiscalYear_companyId_isCurrent_idx" ON "FiscalYear"("companyId", "isCurrent");

-- Only one CURRENT fiscal year per company now, not one globally —
-- each company runs its own FY switcher independently.
CREATE UNIQUE INDEX "FiscalYear_only_one_current_per_company"
    ON "FiscalYear"("companyId")
    WHERE "isCurrent" = true;

-- ------------------------------------------------------------
-- ACCOUNT GROUP — scope to Company
-- ------------------------------------------------------------

ALTER TABLE "AccountGroup" ADD COLUMN "companyId" INTEGER;
UPDATE "AccountGroup" SET "companyId" = (SELECT "id" FROM "Company" ORDER BY "id" LIMIT 1)
WHERE "companyId" IS NULL;
ALTER TABLE "AccountGroup" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "AccountGroup" ADD CONSTRAINT "AccountGroup_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "AccountGroup" DROP CONSTRAINT "AccountGroup_code_key";
ALTER TABLE "AccountGroup" DROP CONSTRAINT "AccountGroup_description_key";
ALTER TABLE "AccountGroup" ADD CONSTRAINT "AccountGroup_companyId_code_key" UNIQUE ("companyId", "code");
ALTER TABLE "AccountGroup" ADD CONSTRAINT "AccountGroup_companyId_description_key" UNIQUE ("companyId", "description");
CREATE INDEX "AccountGroup_companyId_idx" ON "AccountGroup"("companyId");

-- ------------------------------------------------------------
-- GENERAL LEDGER — scope to Company (denormalized, kept in sync
-- by trigger from AccountSubGroup -> AccountGroup.companyId)
-- ------------------------------------------------------------

ALTER TABLE "GeneralLedger" ADD COLUMN "companyId" INTEGER;

UPDATE "GeneralLedger" gl SET "companyId" = ag."companyId"
FROM "AccountSubGroup" asg
JOIN "AccountGroup" ag ON ag."id" = asg."accountGroupId"
WHERE asg."id" = gl."accountSubGroupId" AND gl."companyId" IS NULL;

ALTER TABLE "GeneralLedger" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "GeneralLedger" ADD CONSTRAINT "GeneralLedger_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "GeneralLedger" DROP CONSTRAINT "GeneralLedger_code_key";
ALTER TABLE "GeneralLedger" ADD CONSTRAINT "GeneralLedger_companyId_code_key" UNIQUE ("companyId", "code");
CREATE INDEX "GeneralLedger_companyId_idx" ON "GeneralLedger"("companyId");

-- companyId is denormalized from accountSubGroupId's parent chain —
-- Prisma can't express "FK must match a grandparent's FK", so force
-- it to the correct value on every insert/update instead of trusting
-- whatever the caller sent.
CREATE OR REPLACE FUNCTION fn_sync_gl_company()
RETURNS TRIGGER AS $$
BEGIN
    SELECT ag."companyId" INTO NEW."companyId"
    FROM "AccountSubGroup" asg
    JOIN "AccountGroup" ag ON ag."id" = asg."accountGroupId"
    WHERE asg."id" = NEW."accountSubGroupId";
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_gl_company
BEFORE INSERT OR UPDATE OF "accountSubGroupId" ON "GeneralLedger"
FOR EACH ROW EXECUTE FUNCTION fn_sync_gl_company();

-- ------------------------------------------------------------
-- AREA — scope to Company
-- ------------------------------------------------------------

ALTER TABLE "Area" ADD COLUMN "companyId" INTEGER;
UPDATE "Area" SET "companyId" = (SELECT "id" FROM "Company" ORDER BY "id" LIMIT 1)
WHERE "companyId" IS NULL;
ALTER TABLE "Area" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "Area" ADD CONSTRAINT "Area_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Area" DROP CONSTRAINT "Area_code_key";
ALTER TABLE "Area" DROP CONSTRAINT "Area_name_key";
ALTER TABLE "Area" DROP CONSTRAINT "Area_shortName_key";
ALTER TABLE "Area" ADD CONSTRAINT "Area_companyId_code_key" UNIQUE ("companyId", "code");
ALTER TABLE "Area" ADD CONSTRAINT "Area_companyId_name_key" UNIQUE ("companyId", "name");
ALTER TABLE "Area" ADD CONSTRAINT "Area_companyId_shortName_key" UNIQUE ("companyId", "shortName");
CREATE INDEX "Area_companyId_idx" ON "Area"("companyId");

-- ------------------------------------------------------------
-- AGENT — scope to Company
-- ------------------------------------------------------------

ALTER TABLE "Agent" ADD COLUMN "companyId" INTEGER;
UPDATE "Agent" SET "companyId" = (SELECT "id" FROM "Company" ORDER BY "id" LIMIT 1)
WHERE "companyId" IS NULL;
ALTER TABLE "Agent" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "Agent" ADD CONSTRAINT "Agent_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Agent" DROP CONSTRAINT "Agent_code_key";
ALTER TABLE "Agent" ADD CONSTRAINT "Agent_companyId_code_key" UNIQUE ("companyId", "code");
CREATE INDEX "Agent_companyId_idx" ON "Agent"("companyId");

-- ------------------------------------------------------------
-- PARTY — scope to Company (denormalized, kept in sync by
-- trigger from GeneralLedger.companyId)
-- ------------------------------------------------------------

ALTER TABLE "Party" ADD COLUMN "companyId" INTEGER;

UPDATE "Party" p SET "companyId" = gl."companyId"
FROM "GeneralLedger" gl
WHERE gl."id" = p."generalLedgerId" AND p."companyId" IS NULL;

ALTER TABLE "Party" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "Party" ADD CONSTRAINT "Party_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Party" DROP CONSTRAINT "Party_panNo_key";
ALTER TABLE "Party" ADD CONSTRAINT "Party_companyId_panNo_key" UNIQUE ("companyId", "panNo");
CREATE INDEX "Party_companyId_idx" ON "Party"("companyId");

CREATE OR REPLACE FUNCTION fn_sync_party_company()
RETURNS TRIGGER AS $$
BEGIN
    SELECT gl."companyId" INTO NEW."companyId" FROM "GeneralLedger" gl WHERE gl."id" = NEW."generalLedgerId";
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_party_company
BEFORE INSERT OR UPDATE OF "generalLedgerId" ON "Party"
FOR EACH ROW EXECUTE FUNCTION fn_sync_party_company();

-- ------------------------------------------------------------
-- JOURNAL VOUCHER — scope to Company + Branch
-- ------------------------------------------------------------

ALTER TABLE "JournalVoucher" ADD COLUMN "companyId" INTEGER;
ALTER TABLE "JournalVoucher" ADD COLUMN "branchId" INTEGER;

UPDATE "JournalVoucher" SET
    "companyId" = (SELECT "id" FROM "Company" ORDER BY "id" LIMIT 1),
    "branchId"  = (SELECT b."id" FROM "Branch" b WHERE b."companyId" = (SELECT "id" FROM "Company" ORDER BY "id" LIMIT 1) ORDER BY b."id" LIMIT 1)
WHERE "companyId" IS NULL;

ALTER TABLE "JournalVoucher" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "JournalVoucher" ALTER COLUMN "branchId" SET NOT NULL;
ALTER TABLE "JournalVoucher" ADD CONSTRAINT "JournalVoucher_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "JournalVoucher" ADD CONSTRAINT "JournalVoucher_branchId_fkey"
    FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "JournalVoucher" DROP CONSTRAINT "JournalVoucher_voucherNumber_key";
ALTER TABLE "JournalVoucher" ADD CONSTRAINT "JournalVoucher_branchId_voucherNumber_key" UNIQUE ("branchId", "voucherNumber");
CREATE INDEX "JournalVoucher_companyId_idx" ON "JournalVoucher"("companyId");
CREATE INDEX "JournalVoucher_branchId_idx" ON "JournalVoucher"("branchId");

-- companyId is denormalized from branchId — keep it in sync rather
-- than trusting the caller to pass a matching pair.
CREATE OR REPLACE FUNCTION fn_sync_jv_company()
RETURNS TRIGGER AS $$
BEGIN
    SELECT b."companyId" INTO NEW."companyId" FROM "Branch" b WHERE b."id" = NEW."branchId";
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_jv_company
BEFORE INSERT OR UPDATE OF "branchId" ON "JournalVoucher"
FOR EACH ROW EXECUTE FUNCTION fn_sync_jv_company();

-- ------------------------------------------------------------
-- CASH / BANK VOUCHER — scope to Company + Branch
-- ------------------------------------------------------------

ALTER TABLE "CashBankVoucher" ADD COLUMN "companyId" INTEGER;
ALTER TABLE "CashBankVoucher" ADD COLUMN "branchId" INTEGER;

UPDATE "CashBankVoucher" SET
    "companyId" = (SELECT "id" FROM "Company" ORDER BY "id" LIMIT 1),
    "branchId"  = (SELECT b."id" FROM "Branch" b WHERE b."companyId" = (SELECT "id" FROM "Company" ORDER BY "id" LIMIT 1) ORDER BY b."id" LIMIT 1)
WHERE "companyId" IS NULL;

ALTER TABLE "CashBankVoucher" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "CashBankVoucher" ALTER COLUMN "branchId" SET NOT NULL;
ALTER TABLE "CashBankVoucher" ADD CONSTRAINT "CashBankVoucher_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CashBankVoucher" ADD CONSTRAINT "CashBankVoucher_branchId_fkey"
    FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "CashBankVoucher" DROP CONSTRAINT "CashBankVoucher_voucherNumber_key";
ALTER TABLE "CashBankVoucher" ADD CONSTRAINT "CashBankVoucher_branchId_voucherNumber_key" UNIQUE ("branchId", "voucherNumber");
CREATE INDEX "CashBankVoucher_companyId_idx" ON "CashBankVoucher"("companyId");
CREATE INDEX "CashBankVoucher_branchId_idx" ON "CashBankVoucher"("branchId");

CREATE OR REPLACE FUNCTION fn_sync_cbv_company()
RETURNS TRIGGER AS $$
BEGIN
    SELECT b."companyId" INTO NEW."companyId" FROM "Branch" b WHERE b."id" = NEW."branchId";
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_cbv_company
BEFORE INSERT OR UPDATE OF "branchId" ON "CashBankVoucher"
FOR EACH ROW EXECUTE FUNCTION fn_sync_cbv_company();

-- ------------------------------------------------------------
-- OPENING BALANCE — scope to Company (denormalized from
-- FiscalYear.companyId) + Branch (real, independent column)
-- ------------------------------------------------------------

ALTER TABLE "OpeningBalance" ADD COLUMN "companyId" INTEGER;
ALTER TABLE "OpeningBalance" ADD COLUMN "branchId" INTEGER;

UPDATE "OpeningBalance" ob SET "companyId" = fy."companyId"
FROM "FiscalYear" fy
WHERE fy."id" = ob."fiscalYearId" AND ob."companyId" IS NULL;

UPDATE "OpeningBalance" SET
    "branchId" = (SELECT b."id" FROM "Branch" b WHERE b."companyId" = "OpeningBalance"."companyId" ORDER BY b."id" LIMIT 1)
WHERE "branchId" IS NULL;

ALTER TABLE "OpeningBalance" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "OpeningBalance" ALTER COLUMN "branchId" SET NOT NULL;
ALTER TABLE "OpeningBalance" ADD CONSTRAINT "OpeningBalance_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OpeningBalance" ADD CONSTRAINT "OpeningBalance_branchId_fkey"
    FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "OpeningBalance_companyId_idx" ON "OpeningBalance"("companyId");
CREATE INDEX "OpeningBalance_branchId_idx" ON "OpeningBalance"("branchId");

-- Widen the two partial uniqueness indexes to also key off branchId
-- (one row per GL per year+branch, separately one row per
-- GL+subLedger+branch combination).
DROP INDEX "OpeningBalance_fy_gl_subledger_key";
DROP INDEX "OpeningBalance_fy_gl_nosubledger_key";
DROP INDEX "OpeningBalance_fiscalYearId_generalLedgerId_subLedgerId_idx";

CREATE UNIQUE INDEX "OpeningBalance_fy_branch_gl_subledger_key"
    ON "OpeningBalance"("fiscalYearId", "branchId", "generalLedgerId", "subLedgerId")
    WHERE "subLedgerId" IS NOT NULL;
CREATE UNIQUE INDEX "OpeningBalance_fy_branch_gl_nosubledger_key"
    ON "OpeningBalance"("fiscalYearId", "branchId", "generalLedgerId")
    WHERE "subLedgerId" IS NULL;
CREATE INDEX "OpeningBalance_fy_branch_gl_subledger_idx"
    ON "OpeningBalance"("fiscalYearId", "branchId", "generalLedgerId", "subLedgerId");

-- companyId is denormalized from fiscalYearId — keep it in sync, and
-- while we're deriving it, also make sure the (independently chosen)
-- branchId actually belongs to that same company.
CREATE OR REPLACE FUNCTION fn_sync_ob_company()
RETURNS TRIGGER AS $$
DECLARE
    v_branch_company_id INTEGER;
BEGIN
    SELECT "companyId" INTO NEW."companyId" FROM "FiscalYear" WHERE "id" = NEW."fiscalYearId";

    SELECT "companyId" INTO v_branch_company_id FROM "Branch" WHERE "id" = NEW."branchId";
    IF v_branch_company_id IS DISTINCT FROM NEW."companyId" THEN
        RAISE EXCEPTION 'OpeningBalance.branchId must belong to the same company as its FiscalYear';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_ob_company
BEFORE INSERT OR UPDATE OF "fiscalYearId", "branchId" ON "OpeningBalance"
FOR EACH ROW EXECUTE FUNCTION fn_sync_ob_company();

-- ------------------------------------------------------------
-- STOCK OPENING BALANCE — add Branch (real, independent column)
-- ------------------------------------------------------------

ALTER TABLE "StockOpeningBalance" ADD COLUMN "branchId" INTEGER;

-- Backfill via the fiscal year's company -> that company's (default)
-- branch, since StockOpeningBalance didn't carry a companyId of its
-- own to join through directly.
UPDATE "StockOpeningBalance" sob SET "branchId" = (
    SELECT b."id" FROM "Branch" b
    JOIN "FiscalYear" fy ON fy."id" = sob."fiscalYearId"
    WHERE b."companyId" = fy."companyId"
    ORDER BY b."id" LIMIT 1
)
WHERE sob."branchId" IS NULL;

ALTER TABLE "StockOpeningBalance" ALTER COLUMN "branchId" SET NOT NULL;
ALTER TABLE "StockOpeningBalance" ADD CONSTRAINT "StockOpeningBalance_branchId_fkey"
    FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "StockOpeningBalance_branchId_idx" ON "StockOpeningBalance"("branchId");

DROP INDEX "StockOpeningBalance_unique_row";
DROP INDEX "StockOpeningBalance_fiscalYearId_stockDetailId_idx";

CREATE UNIQUE INDEX "StockOpeningBalance_unique_row"
    ON "StockOpeningBalance"("fiscalYearId", "branchId", "stockDetailId", COALESCE("locationId", 0), COALESCE("batchNo", ''));
CREATE INDEX "StockOpeningBalance_fiscalYearId_branchId_stockDetailId_idx"
    ON "StockOpeningBalance"("fiscalYearId", "branchId", "stockDetailId");

-- ------------------------------------------------------------
-- PRODUCT GROUP / UNIT, TAX RATE, STOCK CATEGORY, LOCATION —
-- scope to Company
-- ------------------------------------------------------------

ALTER TABLE "ProductGroup" ADD COLUMN "companyId" INTEGER;
UPDATE "ProductGroup" SET "companyId" = (SELECT "id" FROM "Company" ORDER BY "id" LIMIT 1) WHERE "companyId" IS NULL;
ALTER TABLE "ProductGroup" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "ProductGroup" ADD CONSTRAINT "ProductGroup_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProductGroup" DROP CONSTRAINT "ProductGroup_code_key";
ALTER TABLE "ProductGroup" DROP CONSTRAINT "ProductGroup_name_key";
ALTER TABLE "ProductGroup" ADD CONSTRAINT "ProductGroup_companyId_code_key" UNIQUE ("companyId", "code");
ALTER TABLE "ProductGroup" ADD CONSTRAINT "ProductGroup_companyId_name_key" UNIQUE ("companyId", "name");
CREATE INDEX "ProductGroup_companyId_idx" ON "ProductGroup"("companyId");

ALTER TABLE "ProductUnit" ADD COLUMN "companyId" INTEGER;
UPDATE "ProductUnit" SET "companyId" = (SELECT "id" FROM "Company" ORDER BY "id" LIMIT 1) WHERE "companyId" IS NULL;
ALTER TABLE "ProductUnit" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "ProductUnit" ADD CONSTRAINT "ProductUnit_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProductUnit" DROP CONSTRAINT "ProductUnit_code_key";
ALTER TABLE "ProductUnit" DROP CONSTRAINT "ProductUnit_name_key";
ALTER TABLE "ProductUnit" ADD CONSTRAINT "ProductUnit_companyId_code_key" UNIQUE ("companyId", "code");
ALTER TABLE "ProductUnit" ADD CONSTRAINT "ProductUnit_companyId_name_key" UNIQUE ("companyId", "name");
CREATE INDEX "ProductUnit_companyId_idx" ON "ProductUnit"("companyId");

ALTER TABLE "TaxRate" ADD COLUMN "companyId" INTEGER;
UPDATE "TaxRate" SET "companyId" = (SELECT "id" FROM "Company" ORDER BY "id" LIMIT 1) WHERE "companyId" IS NULL;
ALTER TABLE "TaxRate" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "TaxRate" ADD CONSTRAINT "TaxRate_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TaxRate" DROP CONSTRAINT "TaxRate_code_key";
ALTER TABLE "TaxRate" ADD CONSTRAINT "TaxRate_companyId_code_key" UNIQUE ("companyId", "code");
CREATE INDEX "TaxRate_companyId_idx" ON "TaxRate"("companyId");

ALTER TABLE "StockCategory" ADD COLUMN "companyId" INTEGER;
UPDATE "StockCategory" SET "companyId" = (SELECT "id" FROM "Company" ORDER BY "id" LIMIT 1) WHERE "companyId" IS NULL;
ALTER TABLE "StockCategory" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "StockCategory" ADD CONSTRAINT "StockCategory_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StockCategory" DROP CONSTRAINT "StockCategory_code_key";
ALTER TABLE "StockCategory" DROP CONSTRAINT "StockCategory_name_key";
ALTER TABLE "StockCategory" ADD CONSTRAINT "StockCategory_companyId_code_key" UNIQUE ("companyId", "code");
ALTER TABLE "StockCategory" ADD CONSTRAINT "StockCategory_companyId_name_key" UNIQUE ("companyId", "name");
CREATE INDEX "StockCategory_companyId_idx" ON "StockCategory"("companyId");

ALTER TABLE "Location" ADD COLUMN "companyId" INTEGER;
UPDATE "Location" SET "companyId" = (SELECT "id" FROM "Company" ORDER BY "id" LIMIT 1) WHERE "companyId" IS NULL;
ALTER TABLE "Location" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "Location" ADD CONSTRAINT "Location_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Location" DROP CONSTRAINT "Location_code_key";
ALTER TABLE "Location" ADD CONSTRAINT "Location_companyId_code_key" UNIQUE ("companyId", "code");
CREATE INDEX "Location_companyId_idx" ON "Location"("companyId");

-- ------------------------------------------------------------
-- PRODUCT — scope to Company
-- ------------------------------------------------------------

ALTER TABLE "Product" ADD COLUMN "companyId" INTEGER;

UPDATE "Product" pr SET "companyId" = pg."companyId"
FROM "ProductSubGroup" psg
JOIN "ProductGroup" pg ON pg."id" = psg."productGroupId"
WHERE psg."id" = pr."productSubGroupId" AND pr."companyId" IS NULL;

ALTER TABLE "Product" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "Product" ADD CONSTRAINT "Product_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Product" DROP CONSTRAINT "Product_code_key";
ALTER TABLE "Product" DROP CONSTRAINT "Product_barcode_key";
ALTER TABLE "Product" ADD CONSTRAINT "Product_companyId_code_key" UNIQUE ("companyId", "code");
ALTER TABLE "Product" ADD CONSTRAINT "Product_companyId_barcode_key" UNIQUE ("companyId", "barcode");
CREATE INDEX "Product_companyId_idx" ON "Product"("companyId");

-- ------------------------------------------------------------
-- COMPANY.retainedEarningsGLId — the referenced GL must belong
-- to this same company
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION fn_check_retained_earnings_gl_company()
RETURNS TRIGGER AS $$
DECLARE
    v_gl_company_id INTEGER;
BEGIN
    IF NEW."retainedEarningsGLId" IS NOT NULL THEN
        SELECT "companyId" INTO v_gl_company_id FROM "GeneralLedger" WHERE "id" = NEW."retainedEarningsGLId";
        IF v_gl_company_id IS DISTINCT FROM NEW."id" THEN
            RAISE EXCEPTION 'Company.retainedEarningsGLId must reference a GeneralLedger belonging to this same company';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_company_retained_earnings_gl_company
BEFORE INSERT OR UPDATE OF "retainedEarningsGLId" ON "Company"
FOR EACH ROW EXECUTE FUNCTION fn_check_retained_earnings_gl_company();

-- ------------------------------------------------------------
-- AUDIT — extend the existing generic audit trigger to the new
-- header-switcher tables, same as every other master table.
-- ------------------------------------------------------------

CREATE TRIGGER trg_audit_company
AFTER INSERT OR UPDATE OR DELETE ON "Company"
FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();

CREATE TRIGGER trg_audit_branch
AFTER INSERT OR UPDATE OR DELETE ON "Branch"
FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();

CREATE TRIGGER trg_audit_user_company_access
AFTER INSERT OR UPDATE OR DELETE ON "UserCompanyAccess"
FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();

CREATE TRIGGER trg_audit_fiscal_year
AFTER INSERT OR UPDATE OR DELETE ON "FiscalYear"
FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();
