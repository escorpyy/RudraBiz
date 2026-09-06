-- ============================================================
-- MIGRATION: Initial schema (AccountGroup, AccountSubGroup,
-- GeneralLedger, Party, CustomerDetail, VendorDetail, User, AuditLog)
-- ============================================================

-- ------------------------------------------------------------
-- ENUMS
-- ------------------------------------------------------------

CREATE TYPE "AccountType" AS ENUM ('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE');
CREATE TYPE "NormalBalance" AS ENUM ('DEBIT', 'CREDIT');
CREATE TYPE "GLType" AS ENUM ('CUSTOMER', 'VENDOR', 'BOTH', 'OTHER');
CREATE TYPE "AuditAction" AS ENUM ('INSERT', 'UPDATE', 'DELETE');
CREATE TYPE "DocumentType" AS ENUM ('CASH_BANK_VOUCHER', 'JOURNAL_VOUCHER', 'SALES_INVOICE', 'PURCHASE_BILL');
CREATE TYPE "InstrumentType" AS ENUM ('CHEQUE', 'RTGS', 'ONLINE_TRANSFER', 'OTHER');

-- ------------------------------------------------------------
-- ACCOUNT GROUP
-- ------------------------------------------------------------

CREATE TABLE "AccountGroup" (
    "id"          SERIAL PRIMARY KEY,
    "code"        VARCHAR(10) NOT NULL,
    "description" VARCHAR(50) NOT NULL,
    "type"        "AccountType" NOT NULL,
    "isActive"    BOOLEAN NOT NULL DEFAULT true,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccountGroup_code_key" UNIQUE ("code"),
    CONSTRAINT "AccountGroup_description_key" UNIQUE ("description")
);

-- ------------------------------------------------------------
-- ACCOUNT SUB GROUP
-- ------------------------------------------------------------

CREATE TABLE "AccountSubGroup" (
    "id"             SERIAL PRIMARY KEY,
    "code"           VARCHAR(10) NOT NULL,
    "description"    VARCHAR(50) NOT NULL,
    "accountGroupId" INTEGER NOT NULL,
    "isActive"       BOOLEAN NOT NULL DEFAULT true,
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"      TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccountSubGroup_accountGroupId_fkey"
        FOREIGN KEY ("accountGroupId") REFERENCES "AccountGroup"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE,

    CONSTRAINT "AccountSubGroup_accountGroupId_code_key" UNIQUE ("accountGroupId", "code"),
    CONSTRAINT "AccountSubGroup_accountGroupId_description_key" UNIQUE ("accountGroupId", "description")
);

CREATE INDEX "AccountSubGroup_accountGroupId_idx" ON "AccountSubGroup"("accountGroupId");

-- ------------------------------------------------------------
-- AREA & SUB AREA
-- Area is the top-level region; SubArea is the level that
-- GeneralLedger/Party actually tag against — same Group/SubGroup
-- pattern as the Chart of Accounts. Created before GeneralLedger
-- since it holds a foreign key to SubArea.
-- ------------------------------------------------------------

CREATE TABLE "Area" (
    "id"        SERIAL PRIMARY KEY,
    "code"      VARCHAR(10) NOT NULL,
    "name"      VARCHAR(50) NOT NULL,
    "shortName" VARCHAR(10) NOT NULL,
    "isActive"  BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Area_code_key" UNIQUE ("code"),
    CONSTRAINT "Area_name_key" UNIQUE ("name"),
    CONSTRAINT "Area_shortName_key" UNIQUE ("shortName")
);

CREATE TABLE "SubArea" (
    "id"        SERIAL PRIMARY KEY,
    "code"      VARCHAR(10) NOT NULL,
    "name"      VARCHAR(50) NOT NULL,
    "shortName" VARCHAR(10) NOT NULL,
    "areaId"    INTEGER NOT NULL,
    "isActive"  BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubArea_areaId_fkey"
        FOREIGN KEY ("areaId") REFERENCES "Area"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE,

    CONSTRAINT "SubArea_areaId_code_key" UNIQUE ("areaId", "code"),
    CONSTRAINT "SubArea_areaId_name_key" UNIQUE ("areaId", "name"),
    CONSTRAINT "SubArea_areaId_shortName_key" UNIQUE ("areaId", "shortName")
);

CREATE INDEX "SubArea_areaId_idx" ON "SubArea"("areaId");

CREATE TABLE "Agent" (
    "id"        SERIAL PRIMARY KEY,
    "code"      VARCHAR(10) NOT NULL,
    "name"      VARCHAR(100) NOT NULL,
    "phone"     VARCHAR(25),
    "isActive"  BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Agent_code_key" UNIQUE ("code")
);

-- ------------------------------------------------------------
-- GENERAL LEDGER
-- ------------------------------------------------------------

CREATE TABLE "GeneralLedger" (
    "id"                SERIAL PRIMARY KEY,
    "code"              VARCHAR(20) NOT NULL,
    "name"              VARCHAR(100) NOT NULL,
    "accountSubGroupId" INTEGER NOT NULL,
    "normalBalance"     "NormalBalance" NOT NULL,
    "glType"            "GLType" NOT NULL DEFAULT 'OTHER',
    "parentId"          INTEGER,
    "isCashOrBank"      BOOLEAN NOT NULL DEFAULT false,
    "postsToCashBook"   BOOLEAN NOT NULL DEFAULT false,
    "requiresSubLedger" BOOLEAN NOT NULL DEFAULT false,
    "allowDocAdjust"    BOOLEAN NOT NULL DEFAULT false,
    "isActive"          BOOLEAN NOT NULL DEFAULT true,
    "subAreaId"         INTEGER,
    "agentId"           INTEGER,
    "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"         TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GeneralLedger_code_key" UNIQUE ("code"),

    CONSTRAINT "GeneralLedger_accountSubGroupId_fkey"
        FOREIGN KEY ("accountSubGroupId") REFERENCES "AccountSubGroup"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE,

    CONSTRAINT "GeneralLedger_parentId_fkey"
        FOREIGN KEY ("parentId") REFERENCES "GeneralLedger"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE,

    CONSTRAINT "GeneralLedger_subAreaId_fkey"
        FOREIGN KEY ("subAreaId") REFERENCES "SubArea"("id")
        ON DELETE SET NULL ON UPDATE CASCADE,

    CONSTRAINT "GeneralLedger_agentId_fkey"
        FOREIGN KEY ("agentId") REFERENCES "Agent"("id")
        ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "GeneralLedger_accountSubGroupId_idx" ON "GeneralLedger"("accountSubGroupId");
CREATE INDEX "GeneralLedger_parentId_idx" ON "GeneralLedger"("parentId");
CREATE INDEX "GeneralLedger_glType_idx" ON "GeneralLedger"("glType");
CREATE INDEX "GeneralLedger_subAreaId_idx" ON "GeneralLedger"("subAreaId");
CREATE INDEX "GeneralLedger_agentId_idx" ON "GeneralLedger"("agentId");

-- ------------------------------------------------------------
-- PARTY
-- ------------------------------------------------------------

CREATE TABLE "Party" (
    "id"                SERIAL PRIMARY KEY,
    "generalLedgerId"   INTEGER NOT NULL,
    "address"           VARCHAR(255),
    "city"              VARCHAR(50),
    "state"             VARCHAR(50),
    "country"           VARCHAR(50),
    "phone"             VARCHAR(25),
    "mobile"            VARCHAR(15),
    "email"             VARCHAR(255),
    "contactPerson"     VARCHAR(50),
    "panNo"             VARCHAR(25),
    "isVatRegistered"   BOOLEAN NOT NULL DEFAULT false,
    "bankReconcileDate" TIMESTAMP(3),
    "subAreaId"         INTEGER,
    "agentId"           INTEGER,
    "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"         TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Party_generalLedgerId_key" UNIQUE ("generalLedgerId"),
    CONSTRAINT "Party_panNo_key" UNIQUE ("panNo"),

    CONSTRAINT "Party_generalLedgerId_fkey"
        FOREIGN KEY ("generalLedgerId") REFERENCES "GeneralLedger"("id")
        ON DELETE CASCADE ON UPDATE CASCADE,

    CONSTRAINT "Party_subAreaId_fkey"
        FOREIGN KEY ("subAreaId") REFERENCES "SubArea"("id")
        ON DELETE SET NULL ON UPDATE CASCADE,

    CONSTRAINT "Party_agentId_fkey"
        FOREIGN KEY ("agentId") REFERENCES "Agent"("id")
        ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "Party_panNo_idx" ON "Party"("panNo");
CREATE INDEX "Party_subAreaId_idx" ON "Party"("subAreaId");
CREATE INDEX "Party_agentId_idx" ON "Party"("agentId");

-- ------------------------------------------------------------
-- CUSTOMER DETAIL
-- ------------------------------------------------------------

CREATE TABLE "CustomerDetail" (
    "id"          SERIAL PRIMARY KEY,
    "partyId"     INTEGER NOT NULL,
    "creditLimit" DECIMAL(18,6),
    "creditDays"  INTEGER,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerDetail_partyId_key" UNIQUE ("partyId"),

    CONSTRAINT "CustomerDetail_partyId_fkey"
        FOREIGN KEY ("partyId") REFERENCES "Party"("id")
        ON DELETE CASCADE ON UPDATE CASCADE
);

-- ------------------------------------------------------------
-- VENDOR DETAIL
-- ------------------------------------------------------------

CREATE TABLE "VendorDetail" (
    "id"              SERIAL PRIMARY KEY,
    "partyId"         INTEGER NOT NULL,
    "paymentTermDays" INTEGER,
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"       TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorDetail_partyId_key" UNIQUE ("partyId"),

    CONSTRAINT "VendorDetail_partyId_fkey"
        FOREIGN KEY ("partyId") REFERENCES "Party"("id")
        ON DELETE CASCADE ON UPDATE CASCADE
);

-- ------------------------------------------------------------
-- USER
-- ------------------------------------------------------------

CREATE TABLE "User" (
    "id"        SERIAL PRIMARY KEY,
    "name"      VARCHAR(100) NOT NULL,
    "email"     VARCHAR(255) NOT NULL,
    "isActive"  BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_email_key" UNIQUE ("email")
);

-- ------------------------------------------------------------
-- AUDIT LOG
-- ------------------------------------------------------------

CREATE TABLE "AuditLog" (
    "id"        BIGSERIAL PRIMARY KEY,
    "tableName" VARCHAR(63) NOT NULL,
    "recordId"  TEXT NOT NULL,
    "action"    "AuditAction" NOT NULL,
    "oldData"   JSONB,
    "newData"   JSONB,
    "changedBy" INTEGER,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_changedBy_fkey"
        FOREIGN KEY ("changedBy") REFERENCES "User"("id")
        ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "AuditLog_tableName_recordId_idx" ON "AuditLog"("tableName", "recordId");
CREATE INDEX "AuditLog_changedAt_idx" ON "AuditLog"("changedAt");

-- ------------------------------------------------------------
-- JOURNAL VOUCHER (non-cash/bank entries)
-- ------------------------------------------------------------

CREATE TABLE "JournalVoucher" (
    "id"            SERIAL PRIMARY KEY,
    "documentType"  "DocumentType" NOT NULL DEFAULT 'JOURNAL_VOUCHER',
    "voucherNumber" VARCHAR(30) NOT NULL,
    "voucherDate"   DATE NOT NULL,
    "fiscalYear"    VARCHAR(15) NOT NULL,
    "remarks"       VARCHAR(1024),
    "reversalOfId"  INTEGER,
    "isPosted"      BOOLEAN NOT NULL DEFAULT false,
    "postedAt"      TIMESTAMP(3),
    "postedBy"      INTEGER,
    "createdBy"     INTEGER,
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"     TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JournalVoucher_voucherNumber_key" UNIQUE ("voucherNumber"),

    CONSTRAINT "JournalVoucher_reversalOfId_fkey"
        FOREIGN KEY ("reversalOfId") REFERENCES "JournalVoucher"("id")
        ON DELETE SET NULL ON UPDATE CASCADE,

    CONSTRAINT "JournalVoucher_postedBy_fkey"
        FOREIGN KEY ("postedBy") REFERENCES "User"("id")
        ON DELETE SET NULL ON UPDATE CASCADE,

    CONSTRAINT "JournalVoucher_createdBy_fkey"
        FOREIGN KEY ("createdBy") REFERENCES "User"("id")
        ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "JournalVoucher_documentType_idx" ON "JournalVoucher"("documentType");
CREATE INDEX "JournalVoucher_fiscalYear_idx" ON "JournalVoucher"("fiscalYear");

CREATE TABLE "JournalVoucherLine" (
    "id"               SERIAL PRIMARY KEY,
    "journalVoucherId" INTEGER NOT NULL,
    "lineNumber"       INTEGER NOT NULL,
    "generalLedgerId"  INTEGER NOT NULL,
    "debit"            DECIMAL(18,6) NOT NULL DEFAULT 0,
    "credit"           DECIMAL(18,6) NOT NULL DEFAULT 0,
    "narration"        VARCHAR(500),
    "agentId"          INTEGER,
    "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JournalVoucherLine_journalVoucherId_fkey"
        FOREIGN KEY ("journalVoucherId") REFERENCES "JournalVoucher"("id")
        ON DELETE CASCADE ON UPDATE CASCADE,

    CONSTRAINT "JournalVoucherLine_generalLedgerId_fkey"
        FOREIGN KEY ("generalLedgerId") REFERENCES "GeneralLedger"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE,

    CONSTRAINT "JournalVoucherLine_agentId_fkey"
        FOREIGN KEY ("agentId") REFERENCES "Agent"("id")
        ON DELETE SET NULL ON UPDATE CASCADE,

    CONSTRAINT "JournalVoucherLine_journalVoucherId_lineNumber_key"
        UNIQUE ("journalVoucherId", "lineNumber"),

    CONSTRAINT "JournalVoucherLine_debit_credit_not_both_check"
        CHECK (NOT ("debit" > 0 AND "credit" > 0))
);

CREATE INDEX "JournalVoucherLine_generalLedgerId_idx" ON "JournalVoucherLine"("generalLedgerId");
CREATE INDEX "JournalVoucherLine_agentId_idx" ON "JournalVoucherLine"("agentId");

-- ------------------------------------------------------------
-- CASH / BANK VOUCHER (cash and bank-touching entries)
-- ------------------------------------------------------------

CREATE TABLE "CashBankVoucher" (
    "id"            SERIAL PRIMARY KEY,
    "documentType"  "DocumentType" NOT NULL DEFAULT 'CASH_BANK_VOUCHER',
    "voucherNumber" VARCHAR(30) NOT NULL,
    "voucherDate"   DATE NOT NULL,
    "fiscalYear"    VARCHAR(15) NOT NULL,
    "remarks"       VARCHAR(1024),
    "reversalOfId"  INTEGER,
    "isPosted"      BOOLEAN NOT NULL DEFAULT false,
    "postedAt"      TIMESTAMP(3),
    "postedBy"      INTEGER,
    "createdBy"     INTEGER,
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"     TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CashBankVoucher_voucherNumber_key" UNIQUE ("voucherNumber"),

    CONSTRAINT "CashBankVoucher_reversalOfId_fkey"
        FOREIGN KEY ("reversalOfId") REFERENCES "CashBankVoucher"("id")
        ON DELETE SET NULL ON UPDATE CASCADE,

    CONSTRAINT "CashBankVoucher_postedBy_fkey"
        FOREIGN KEY ("postedBy") REFERENCES "User"("id")
        ON DELETE SET NULL ON UPDATE CASCADE,

    CONSTRAINT "CashBankVoucher_createdBy_fkey"
        FOREIGN KEY ("createdBy") REFERENCES "User"("id")
        ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "CashBankVoucher_documentType_idx" ON "CashBankVoucher"("documentType");
CREATE INDEX "CashBankVoucher_fiscalYear_idx" ON "CashBankVoucher"("fiscalYear");

CREATE TABLE "CashBankVoucherLine" (
    "id"                SERIAL PRIMARY KEY,
    "cashBankVoucherId" INTEGER NOT NULL,
    "lineNumber"        INTEGER NOT NULL,
    "generalLedgerId"   INTEGER NOT NULL,
    "debit"             DECIMAL(18,6) NOT NULL DEFAULT 0,
    "credit"            DECIMAL(18,6) NOT NULL DEFAULT 0,
    "narration"         VARCHAR(500),
    "instrumentType"    "InstrumentType",
    "chequeNumber"      VARCHAR(30),
    "chequeDate"        DATE,
    "chequeBankName"    VARCHAR(50),
    "chequeBankBranch"  VARCHAR(50),
    "isCleared"         BOOLEAN NOT NULL DEFAULT false,
    "clearedDate"       DATE,
    "clearedBy"         INTEGER,
    "agentId"           INTEGER,
    "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CashBankVoucherLine_cashBankVoucherId_fkey"
        FOREIGN KEY ("cashBankVoucherId") REFERENCES "CashBankVoucher"("id")
        ON DELETE CASCADE ON UPDATE CASCADE,

    CONSTRAINT "CashBankVoucherLine_generalLedgerId_fkey"
        FOREIGN KEY ("generalLedgerId") REFERENCES "GeneralLedger"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE,

    CONSTRAINT "CashBankVoucherLine_agentId_fkey"
        FOREIGN KEY ("agentId") REFERENCES "Agent"("id")
        ON DELETE SET NULL ON UPDATE CASCADE,

    CONSTRAINT "CashBankVoucherLine_clearedBy_fkey"
        FOREIGN KEY ("clearedBy") REFERENCES "User"("id")
        ON DELETE SET NULL ON UPDATE CASCADE,

    CONSTRAINT "CashBankVoucherLine_cashBankVoucherId_lineNumber_key"
        UNIQUE ("cashBankVoucherId", "lineNumber"),

    CONSTRAINT "CashBankVoucherLine_debit_credit_not_both_check"
        CHECK (NOT ("debit" > 0 AND "credit" > 0))
);

CREATE INDEX "CashBankVoucherLine_generalLedgerId_idx" ON "CashBankVoucherLine"("generalLedgerId");
CREATE INDEX "CashBankVoucherLine_agentId_idx" ON "CashBankVoucherLine"("agentId");
CREATE INDEX "CashBankVoucherLine_chequeNumber_idx" ON "CashBankVoucherLine"("chequeNumber");

-- ============================================================
-- GENERIC AUDIT TRIGGER FUNCTION
-- ============================================================
-- Reads the acting user from a session variable the app sets per
-- transaction: SET LOCAL app.current_user_id = '<id>';
-- Falls back to NULL if not set (e.g. system/migration scripts).

CREATE OR REPLACE FUNCTION fn_audit_trigger()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id INTEGER;
    v_record_id TEXT;
BEGIN
    BEGIN
        v_user_id := current_setting('app.current_user_id', true)::INTEGER;
    EXCEPTION WHEN OTHERS THEN
        v_user_id := NULL;
    END;

    IF (TG_OP = 'DELETE') THEN
        v_record_id := OLD."id"::TEXT;
        INSERT INTO "AuditLog"("tableName", "recordId", "action", "oldData", "newData", "changedBy")
        VALUES (TG_TABLE_NAME, v_record_id, 'DELETE', to_jsonb(OLD), NULL, v_user_id);
        RETURN OLD;
    ELSIF (TG_OP = 'UPDATE') THEN
        v_record_id := NEW."id"::TEXT;
        INSERT INTO "AuditLog"("tableName", "recordId", "action", "oldData", "newData", "changedBy")
        VALUES (TG_TABLE_NAME, v_record_id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW), v_user_id);
        RETURN NEW;
    ELSIF (TG_OP = 'INSERT') THEN
        v_record_id := NEW."id"::TEXT;
        INSERT INTO "AuditLog"("tableName", "recordId", "action", "oldData", "newData", "changedBy")
        VALUES (TG_TABLE_NAME, v_record_id, 'INSERT', NULL, to_jsonb(NEW), v_user_id);
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Attach the trigger to every audited table.
-- (AuditLog itself is intentionally excluded — it must not audit itself.)

CREATE TRIGGER trg_audit_account_group
AFTER INSERT OR UPDATE OR DELETE ON "AccountGroup"
FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();

CREATE TRIGGER trg_audit_account_sub_group
AFTER INSERT OR UPDATE OR DELETE ON "AccountSubGroup"
FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();

CREATE TRIGGER trg_audit_general_ledger
AFTER INSERT OR UPDATE OR DELETE ON "GeneralLedger"
FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();

CREATE TRIGGER trg_audit_area
AFTER INSERT OR UPDATE OR DELETE ON "Area"
FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();

CREATE TRIGGER trg_audit_sub_area
AFTER INSERT OR UPDATE OR DELETE ON "SubArea"
FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();

CREATE TRIGGER trg_audit_agent
AFTER INSERT OR UPDATE OR DELETE ON "Agent"
FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();

CREATE TRIGGER trg_audit_party
AFTER INSERT OR UPDATE OR DELETE ON "Party"
FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();

CREATE TRIGGER trg_audit_customer_detail
AFTER INSERT OR UPDATE OR DELETE ON "CustomerDetail"
FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();

CREATE TRIGGER trg_audit_vendor_detail
AFTER INSERT OR UPDATE OR DELETE ON "VendorDetail"
FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();

CREATE TRIGGER trg_audit_journal_voucher
AFTER INSERT OR UPDATE OR DELETE ON "JournalVoucher"
FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();

CREATE TRIGGER trg_audit_journal_voucher_line
AFTER INSERT OR UPDATE OR DELETE ON "JournalVoucherLine"
FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();

CREATE TRIGGER trg_audit_cash_bank_voucher
AFTER INSERT OR UPDATE OR DELETE ON "CashBankVoucher"
FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();

CREATE TRIGGER trg_audit_cash_bank_voucher_line
AFTER INSERT OR UPDATE OR DELETE ON "CashBankVoucherLine"
FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();

-- ============================================================
-- VOUCHER INTEGRITY TRIGGERS
-- These five rules are the accounting backbone of the system —
-- all hard DB-enforced, not app-layer, per explicit decision.
-- ============================================================

-- ------------------------------------------------------------
-- 1. DEBIT = CREDIT balance check, per voucher.
-- Fires after any line change on either voucher type; sums all
-- lines for that voucher and rejects if debits != credits.
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION fn_check_jv_balance()
RETURNS TRIGGER AS $$
DECLARE
    v_jv_id INTEGER;
    v_total_debit DECIMAL(18,6);
    v_total_credit DECIMAL(18,6);
BEGIN
    v_jv_id := COALESCE(NEW."journalVoucherId", OLD."journalVoucherId");

    SELECT COALESCE(SUM("debit"), 0), COALESCE(SUM("credit"), 0)
    INTO v_total_debit, v_total_credit
    FROM "JournalVoucherLine"
    WHERE "journalVoucherId" = v_jv_id;

    IF v_total_debit <> v_total_credit THEN
        RAISE EXCEPTION 'JournalVoucher % is out of balance: debit % != credit %',
            v_jv_id, v_total_debit, v_total_credit;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE CONSTRAINT TRIGGER trg_check_jv_balance
AFTER INSERT OR UPDATE OR DELETE ON "JournalVoucherLine"
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION fn_check_jv_balance();

CREATE OR REPLACE FUNCTION fn_check_cbv_balance()
RETURNS TRIGGER AS $$
DECLARE
    v_cbv_id INTEGER;
    v_total_debit DECIMAL(18,6);
    v_total_credit DECIMAL(18,6);
BEGIN
    v_cbv_id := COALESCE(NEW."cashBankVoucherId", OLD."cashBankVoucherId");

    SELECT COALESCE(SUM("debit"), 0), COALESCE(SUM("credit"), 0)
    INTO v_total_debit, v_total_credit
    FROM "CashBankVoucherLine"
    WHERE "cashBankVoucherId" = v_cbv_id;

    IF v_total_debit <> v_total_credit THEN
        RAISE EXCEPTION 'CashBankVoucher % is out of balance: debit % != credit %',
            v_cbv_id, v_total_debit, v_total_credit;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE CONSTRAINT TRIGGER trg_check_cbv_balance
AFTER INSERT OR UPDATE OR DELETE ON "CashBankVoucherLine"
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION fn_check_cbv_balance();

-- Note: both triggers are DEFERRABLE INITIALLY DEFERRED — meaning the
-- check runs at COMMIT, not after each individual line insert. This is
-- essential: a voucher is built by inserting lines one at a time, so
-- checking balance after the FIRST line would always fail. The app
-- must insert all lines for a voucher within a single transaction.

-- ------------------------------------------------------------
-- 2. requiresSubLedger enforcement — reject posting directly to
-- a GL marked as a control account (both voucher line types).
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION fn_check_no_control_account_posting()
RETURNS TRIGGER AS $$
DECLARE
    v_requires_sub_ledger BOOLEAN;
BEGIN
    SELECT "requiresSubLedger" INTO v_requires_sub_ledger
    FROM "GeneralLedger" WHERE "id" = NEW."generalLedgerId";

    IF v_requires_sub_ledger THEN
        RAISE EXCEPTION 'GeneralLedger % is a control account (requiresSubLedger=true) and cannot be posted to directly; post to one of its child ledgers instead',
            NEW."generalLedgerId";
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_jvl_no_control_account
BEFORE INSERT OR UPDATE ON "JournalVoucherLine"
FOR EACH ROW EXECUTE FUNCTION fn_check_no_control_account_posting();

CREATE TRIGGER trg_cbvl_no_control_account
BEFORE INSERT OR UPDATE ON "CashBankVoucherLine"
FOR EACH ROW EXECUTE FUNCTION fn_check_no_control_account_posting();

-- ------------------------------------------------------------
-- 3. CashBankVoucher must touch cash/bank — at least one line
-- in the voucher must reference a GL where isCashOrBank=true.
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION fn_check_cbv_has_cash_or_bank_line()
RETURNS TRIGGER AS $$
DECLARE
    v_cbv_id INTEGER;
    v_has_cash_or_bank BOOLEAN;
BEGIN
    v_cbv_id := COALESCE(NEW."cashBankVoucherId", OLD."cashBankVoucherId");

    SELECT EXISTS (
        SELECT 1 FROM "CashBankVoucherLine" cbl
        JOIN "GeneralLedger" gl ON gl."id" = cbl."generalLedgerId"
        WHERE cbl."cashBankVoucherId" = v_cbv_id AND gl."isCashOrBank" = true
    ) INTO v_has_cash_or_bank;

    IF NOT v_has_cash_or_bank THEN
        RAISE EXCEPTION 'CashBankVoucher % must have at least one line posting to a Cash or Bank account; use a JournalVoucher instead',
            v_cbv_id;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE CONSTRAINT TRIGGER trg_cbv_has_cash_or_bank_line
AFTER INSERT OR UPDATE OR DELETE ON "CashBankVoucherLine"
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION fn_check_cbv_has_cash_or_bank_line();

-- ------------------------------------------------------------
-- 4. JournalVoucher must NOT touch cash/bank — no line may
-- reference a GL where isCashOrBank=true.
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION fn_check_jvl_not_cash_or_bank()
RETURNS TRIGGER AS $$
DECLARE
    v_is_cash_or_bank BOOLEAN;
BEGIN
    SELECT "isCashOrBank" INTO v_is_cash_or_bank
    FROM "GeneralLedger" WHERE "id" = NEW."generalLedgerId";

    IF v_is_cash_or_bank THEN
        RAISE EXCEPTION 'GeneralLedger % is a Cash/Bank account and cannot be posted to via a JournalVoucher; use a CashBankVoucher instead',
            NEW."generalLedgerId";
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_jvl_not_cash_or_bank
BEFORE INSERT OR UPDATE ON "JournalVoucherLine"
FOR EACH ROW EXECUTE FUNCTION fn_check_jvl_not_cash_or_bank();

-- ------------------------------------------------------------
-- 5. Posted immutability — once isPosted=true, block further
-- UPDATE/DELETE on the voucher header and its lines. Corrections
-- must go through the reversalOf link instead.
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION fn_block_posted_jv_edit()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'UPDATE' AND OLD."isPosted" = true AND NEW."isPosted" = true) THEN
        RAISE EXCEPTION 'JournalVoucher % is posted and cannot be edited; create a reversing entry instead', OLD."id";
    ELSIF (TG_OP = 'DELETE' AND OLD."isPosted" = true) THEN
        RAISE EXCEPTION 'JournalVoucher % is posted and cannot be deleted; create a reversing entry instead', OLD."id";
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_block_posted_jv_edit
BEFORE UPDATE OR DELETE ON "JournalVoucher"
FOR EACH ROW EXECUTE FUNCTION fn_block_posted_jv_edit();

CREATE OR REPLACE FUNCTION fn_block_posted_jvl_edit()
RETURNS TRIGGER AS $$
DECLARE
    v_is_posted BOOLEAN;
BEGIN
    SELECT "isPosted" INTO v_is_posted FROM "JournalVoucher"
    WHERE "id" = COALESCE(NEW."journalVoucherId", OLD."journalVoucherId");

    IF v_is_posted THEN
        RAISE EXCEPTION 'Cannot modify lines of a posted JournalVoucher; create a reversing entry instead';
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_block_posted_jvl_edit
BEFORE INSERT OR UPDATE OR DELETE ON "JournalVoucherLine"
FOR EACH ROW EXECUTE FUNCTION fn_block_posted_jvl_edit();

CREATE OR REPLACE FUNCTION fn_block_posted_cbv_edit()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'UPDATE' AND OLD."isPosted" = true AND NEW."isPosted" = true) THEN
        RAISE EXCEPTION 'CashBankVoucher % is posted and cannot be edited; create a reversing entry instead', OLD."id";
    ELSIF (TG_OP = 'DELETE' AND OLD."isPosted" = true) THEN
        RAISE EXCEPTION 'CashBankVoucher % is posted and cannot be deleted; create a reversing entry instead', OLD."id";
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_block_posted_cbv_edit
BEFORE UPDATE OR DELETE ON "CashBankVoucher"
FOR EACH ROW EXECUTE FUNCTION fn_block_posted_cbv_edit();

CREATE OR REPLACE FUNCTION fn_block_posted_cbvl_edit()
RETURNS TRIGGER AS $$
DECLARE
    v_is_posted BOOLEAN;
BEGIN
    SELECT "isPosted" INTO v_is_posted FROM "CashBankVoucher"
    WHERE "id" = COALESCE(NEW."cashBankVoucherId", OLD."cashBankVoucherId");

    IF v_is_posted THEN
        RAISE EXCEPTION 'Cannot modify lines of a posted CashBankVoucher; create a reversing entry instead';
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_block_posted_cbvl_edit
BEFORE INSERT OR UPDATE OR DELETE ON "CashBankVoucherLine"
FOR EACH ROW EXECUTE FUNCTION fn_block_posted_cbvl_edit();

-- ============================================================
-- LEDGER STATEMENT VIEW
-- Unions posted lines from both voucher types — the foundation
-- for GL statements, Trial Balance, and financial statements.
-- Only posted vouchers are included; drafts don't affect balances.
-- ============================================================

CREATE VIEW "vw_ledger_transactions" AS
SELECT
    'JOURNAL' AS "source",
    jv."id" AS "voucherId",
    jv."voucherNumber",
    jv."voucherDate",
    jvl."generalLedgerId",
    jvl."debit",
    jvl."credit",
    jvl."narration"
FROM "JournalVoucherLine" jvl
JOIN "JournalVoucher" jv ON jv."id" = jvl."journalVoucherId"
WHERE jv."isPosted" = true

UNION ALL

SELECT
    'CASH_BANK' AS "source",
    cbv."id" AS "voucherId",
    cbv."voucherNumber",
    cbv."voucherDate",
    cbl."generalLedgerId",
    cbl."debit",
    cbl."credit",
    cbl."narration"
FROM "CashBankVoucherLine" cbl
JOIN "CashBankVoucher" cbv ON cbv."id" = cbl."cashBankVoucherId"
WHERE cbv."isPosted" = true;

-- ============================================================
-- AUDIT LOG IMMUTABILITY
-- ============================================================
-- The app's DB role must not be able to alter or erase history.
-- Replace "app_role" with your actual application database role.

-- REVOKE UPDATE, DELETE ON "AuditLog" FROM app_role;
