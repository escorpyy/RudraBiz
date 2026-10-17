-- ============================================================
-- MIGRATION: Add FiscalYear, Company (setup profile), and
--            User.calendarPreference
-- ============================================================

-- ------------------------------------------------------------
-- ENUMS
-- ------------------------------------------------------------

CREATE TYPE "CalendarPreference" AS ENUM ('BS', 'AD');

-- ------------------------------------------------------------
-- COMPANY  (single-row setup profile)
-- ------------------------------------------------------------

CREATE TABLE "Company" (
    "id"                   SERIAL PRIMARY KEY,
    "name"                 VARCHAR(200) NOT NULL,
    "panOrVatNo"           VARCHAR(25),
    "address"              VARCHAR(300),
    "phone"                VARCHAR(20),
    "email"                VARCHAR(255),
    "logoUrl"              VARCHAR(500),
    "baseCurrency"         VARCHAR(3) NOT NULL DEFAULT 'NPR',
    "retainedEarningsGLId" INTEGER,
    "createdAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"            TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_retainedEarningsGLId_key" UNIQUE ("retainedEarningsGLId"),

    -- Enforces this as a singleton table: only the row with id = 1 may
    -- ever exist. Prisma has no native concept of a singleton table, so
    -- this is added by hand rather than generated from the schema.
    CONSTRAINT "Company_singleton_check" CHECK ("id" = 1),

    CONSTRAINT "Company_retainedEarningsGLId_fkey"
        FOREIGN KEY ("retainedEarningsGLId") REFERENCES "GeneralLedger"("id")
        ON DELETE SET NULL ON UPDATE CASCADE
);

-- ------------------------------------------------------------
-- FISCAL YEAR
-- ------------------------------------------------------------

CREATE TABLE "FiscalYear" (
    "id"        SERIAL PRIMARY KEY,
    "code"      VARCHAR(15) NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate"   DATE NOT NULL,
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "isClosed"  BOOLEAN NOT NULL DEFAULT false,
    "closedAt"  TIMESTAMP(3),
    "closedBy"  INTEGER,
    "isActive"  BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FiscalYear_code_key" UNIQUE ("code"),

    CONSTRAINT "FiscalYear_dateRange_check" CHECK ("endDate" > "startDate"),

    -- A year can't be both the active year and closed at the same time.
    CONSTRAINT "FiscalYear_closedNotCurrent_check"
        CHECK (NOT ("isCurrent" = true AND "isClosed" = true)),

    CONSTRAINT "FiscalYear_closedBy_fkey"
        FOREIGN KEY ("closedBy") REFERENCES "User"("id")
        ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "FiscalYear_isCurrent_idx" ON "FiscalYear"("isCurrent");
CREATE INDEX "FiscalYear_isClosed_idx" ON "FiscalYear"("isClosed");

-- Only one fiscal year may be current at a time. A plain UNIQUE
-- constraint can't express "unique only when true" — Postgres's partial
-- unique index is the standard way to enforce this, and it's the reason
-- this migration has to be hand-written rather than Prisma-generated.
CREATE UNIQUE INDEX "FiscalYear_only_one_current"
    ON "FiscalYear"("isCurrent")
    WHERE "isCurrent" = true;

-- ------------------------------------------------------------
-- USER — add calendarPreference
-- ------------------------------------------------------------

ALTER TABLE "User"
    ADD COLUMN "calendarPreference" "CalendarPreference" NOT NULL DEFAULT 'BS';
