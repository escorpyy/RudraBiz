-- ============================================================
-- MIGRATION: Add OpeningBalance, StockOpeningBalance, and
--            FiscalYear.isOpeningBalanceLocked
-- ============================================================

-- ------------------------------------------------------------
-- FISCAL YEAR — add the opening-balance lock flag
-- ------------------------------------------------------------

ALTER TABLE "FiscalYear"
    ADD COLUMN "isOpeningBalanceLocked" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "openingBalanceLockedAt" TIMESTAMP(3),
    ADD COLUMN "openingBalanceLockedBy" INTEGER;

ALTER TABLE "FiscalYear"
    ADD CONSTRAINT "FiscalYear_openingBalanceLockedBy_fkey"
        FOREIGN KEY ("openingBalanceLockedBy") REFERENCES "User"("id")
        ON DELETE SET NULL ON UPDATE CASCADE;

-- ------------------------------------------------------------
-- OPENING BALANCE
-- ------------------------------------------------------------

CREATE TABLE "OpeningBalance" (
    "id"                   SERIAL PRIMARY KEY,
    "fiscalYearId"         INTEGER NOT NULL,
    "generalLedgerId"      INTEGER NOT NULL,
    "subLedgerId"          INTEGER,
    "debit"                DECIMAL(18,6) NOT NULL DEFAULT 0,
    "credit"               DECIMAL(18,6) NOT NULL DEFAULT 0,
    "remarks"              VARCHAR(500),
    "carriedForwardFromId" INTEGER,
    "createdBy"            INTEGER,
    "createdAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"            TIMESTAMP(3) NOT NULL,

    -- Same convention as JournalVoucherLine/CashBankVoucherLine: a row
    -- may not carry an amount on both sides at once, but an all-zero
    -- row is permitted (matches the existing app-wide pattern).
    CONSTRAINT "OpeningBalance_debit_nonneg_check" CHECK ("debit" >= 0),
    CONSTRAINT "OpeningBalance_credit_nonneg_check" CHECK ("credit" >= 0),
    CONSTRAINT "OpeningBalance_debit_credit_not_both_check"
        CHECK (NOT ("debit" > 0 AND "credit" > 0)),

    CONSTRAINT "OpeningBalance_fiscalYearId_fkey"
        FOREIGN KEY ("fiscalYearId") REFERENCES "FiscalYear"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "OpeningBalance_generalLedgerId_fkey"
        FOREIGN KEY ("generalLedgerId") REFERENCES "GeneralLedger"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "OpeningBalance_subLedgerId_fkey"
        FOREIGN KEY ("subLedgerId") REFERENCES "SubLedger"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "OpeningBalance_carriedForwardFromId_fkey"
        FOREIGN KEY ("carriedForwardFromId") REFERENCES "OpeningBalance"("id")
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "OpeningBalance_createdBy_fkey"
        FOREIGN KEY ("createdBy") REFERENCES "User"("id")
        ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "OpeningBalance_fiscalYearId_generalLedgerId_subLedgerId_idx"
    ON "OpeningBalance"("fiscalYearId", "generalLedgerId", "subLedgerId");
CREATE INDEX "OpeningBalance_generalLedgerId_idx" ON "OpeningBalance"("generalLedgerId");
CREATE INDEX "OpeningBalance_subLedgerId_idx" ON "OpeningBalance"("subLedgerId");

-- Real uniqueness, split into two partial indexes because a plain
-- composite UNIQUE would treat every NULL subLedgerId as distinct
-- (the same gap noted on FiscalYear.isCurrent) and let two "plain GL,
-- no subledger" rows through for the same year.
CREATE UNIQUE INDEX "OpeningBalance_fy_gl_subledger_key"
    ON "OpeningBalance"("fiscalYearId", "generalLedgerId", "subLedgerId")
    WHERE "subLedgerId" IS NOT NULL;
CREATE UNIQUE INDEX "OpeningBalance_fy_gl_nosubledger_key"
    ON "OpeningBalance"("fiscalYearId", "generalLedgerId")
    WHERE "subLedgerId" IS NULL;

-- Reuse the existing control-account guard (already governs
-- JournalVoucherLine/CashBankVoucherLine) instead of writing new
-- logic: a GL with requiresSubLedger=true still can't be posted to
-- directly here either — post to its child leaf ledgers instead
-- (e.g. each Party's own dedicated GeneralLedger).
CREATE TRIGGER trg_ob_no_control_account
BEFORE INSERT OR UPDATE ON "OpeningBalance"
FOR EACH ROW EXECUTE FUNCTION fn_check_no_control_account_posting();

-- Mirrors fn_block_posted_jvl_edit: once the fiscal year's opening
-- balance is locked, no row for that year can be changed or removed.
CREATE OR REPLACE FUNCTION fn_block_locked_ob_edit()
RETURNS TRIGGER AS $$
DECLARE
    v_is_locked BOOLEAN;
BEGIN
    SELECT "isOpeningBalanceLocked" INTO v_is_locked FROM "FiscalYear"
    WHERE "id" = COALESCE(NEW."fiscalYearId", OLD."fiscalYearId");

    IF v_is_locked THEN
        RAISE EXCEPTION 'Opening balance for this fiscal year is locked; unlock the fiscal year to make corrections';
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_block_locked_ob_edit
BEFORE INSERT OR UPDATE OR DELETE ON "OpeningBalance"
FOR EACH ROW EXECUTE FUNCTION fn_block_locked_ob_edit();

CREATE TRIGGER trg_audit_opening_balance
AFTER INSERT OR UPDATE OR DELETE ON "OpeningBalance"
FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();

-- ------------------------------------------------------------
-- STOCK OPENING BALANCE
-- ------------------------------------------------------------

CREATE TABLE "StockOpeningBalance" (
    "id"                   SERIAL PRIMARY KEY,
    "fiscalYearId"         INTEGER NOT NULL,
    "stockDetailId"        INTEGER NOT NULL,
    "locationId"           INTEGER,
    "batchNo"              VARCHAR(50),
    "expiryDate"           DATE,
    "quantity"             DECIMAL(18,6) NOT NULL,
    "rate"                 DECIMAL(18,6) NOT NULL,
    "value"                DECIMAL(18,6) NOT NULL,
    "carriedForwardFromId" INTEGER,
    "createdAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"            TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockOpeningBalance_quantity_nonneg_check" CHECK ("quantity" >= 0),
    CONSTRAINT "StockOpeningBalance_rate_nonneg_check" CHECK ("rate" >= 0),
    CONSTRAINT "StockOpeningBalance_value_nonneg_check" CHECK ("value" >= 0),

    CONSTRAINT "StockOpeningBalance_fiscalYearId_fkey"
        FOREIGN KEY ("fiscalYearId") REFERENCES "FiscalYear"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "StockOpeningBalance_stockDetailId_fkey"
        FOREIGN KEY ("stockDetailId") REFERENCES "StockDetail"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "StockOpeningBalance_locationId_fkey"
        FOREIGN KEY ("locationId") REFERENCES "Location"("id")
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "StockOpeningBalance_carriedForwardFromId_fkey"
        FOREIGN KEY ("carriedForwardFromId") REFERENCES "StockOpeningBalance"("id")
        ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "StockOpeningBalance_fiscalYearId_stockDetailId_idx"
    ON "StockOpeningBalance"("fiscalYearId", "stockDetailId");
CREATE INDEX "StockOpeningBalance_stockDetailId_idx" ON "StockOpeningBalance"("stockDetailId");

-- Real uniqueness via a COALESCE-based expression index, since
-- locationId/batchNo are both nullable and a plain composite unique
-- would have the same NULL-handling gap as OpeningBalance above.
CREATE UNIQUE INDEX "StockOpeningBalance_unique_row"
    ON "StockOpeningBalance"("fiscalYearId", "stockDetailId", COALESCE("locationId", 0), COALESCE("batchNo", ''));

-- Mirrors fn_block_locked_ob_edit — same lock flag, same fiscal year.
CREATE OR REPLACE FUNCTION fn_block_locked_sob_edit()
RETURNS TRIGGER AS $$
DECLARE
    v_is_locked BOOLEAN;
BEGIN
    SELECT "isOpeningBalanceLocked" INTO v_is_locked FROM "FiscalYear"
    WHERE "id" = COALESCE(NEW."fiscalYearId", OLD."fiscalYearId");

    IF v_is_locked THEN
        RAISE EXCEPTION 'Stock opening balance for this fiscal year is locked; unlock the fiscal year to make corrections';
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_block_locked_sob_edit
BEFORE INSERT OR UPDATE OR DELETE ON "StockOpeningBalance"
FOR EACH ROW EXECUTE FUNCTION fn_block_locked_sob_edit();

CREATE TRIGGER trg_audit_stock_opening_balance
AFTER INSERT OR UPDATE OR DELETE ON "StockOpeningBalance"
FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();
