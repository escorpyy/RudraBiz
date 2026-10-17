-- BASELINE: concatenation of the legacy Prisma migrations, in order (triggers, partial indexes,
-- COALESCE unique index included). Never edit; add new migrations after this one.

-- >>> 20260906021153_init
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

-- >>> 20260908143453_add_sub_ledger
-- ============================================================
-- MIGRATION: Add SubLedger
-- ============================================================

CREATE TABLE "SubLedger" (
    "id"              SERIAL PRIMARY KEY,
    "code"            VARCHAR(20) NOT NULL,
    "name"            VARCHAR(100) NOT NULL,
    "generalLedgerId" INTEGER,
    "partyId"         INTEGER,
    "isActive"        BOOLEAN NOT NULL DEFAULT true,
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"       TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubLedger_code_key" UNIQUE ("code")
);

CREATE INDEX "SubLedger_generalLedgerId_idx" ON "SubLedger"("generalLedgerId");
CREATE INDEX "SubLedger_partyId_idx" ON "SubLedger"("partyId");

ALTER TABLE "SubLedger"
    ADD CONSTRAINT "SubLedger_generalLedgerId_fkey"
    FOREIGN KEY ("generalLedgerId") REFERENCES "GeneralLedger"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "SubLedger"
    ADD CONSTRAINT "SubLedger_partyId_fkey"
    FOREIGN KEY ("partyId") REFERENCES "Party"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- >>> 20260909012133_
-- DropIndex
DROP INDEX "AccountSubGroup_accountGroupId_idx";

-- DropIndex
DROP INDEX "SubArea_areaId_idx";

-- >>> 20260911090000_add_product_catalog
-- ============================================================
-- MIGRATION: Add Product Catalog
-- (ProductGroup, ProductSubGroup, ProductUnit, TaxRate,
--  StockCategory, Location, Product, StockDetail, AlternateUnit,
--  NonStockDetail, ServiceDetail, FixedAssetDetail, BundleDetail,
--  BundleComponent)
-- ============================================================

-- ------------------------------------------------------------
-- ENUMS
-- ------------------------------------------------------------

CREATE TYPE "ProductType" AS ENUM ('STOCK', 'NON_STOCK', 'SERVICE', 'FIXED_ASSET', 'BUNDLE');
CREATE TYPE "ValuationMethod" AS ENUM ('FIFO', 'WEIGHTED_AVERAGE', 'STANDARD_COST');
CREATE TYPE "DepreciationMethod" AS ENUM ('STRAIGHT_LINE', 'WRITTEN_DOWN_VALUE');

-- ------------------------------------------------------------
-- PRODUCT UNIT
-- ------------------------------------------------------------

CREATE TABLE "ProductUnit" (
    "id"            SERIAL PRIMARY KEY,
    "code"          VARCHAR(10) NOT NULL,
    "name"          VARCHAR(50) NOT NULL,
    "decimalPlaces" INTEGER NOT NULL DEFAULT 0,
    "isActive"      BOOLEAN NOT NULL DEFAULT true,
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"     TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductUnit_code_key" UNIQUE ("code"),
    CONSTRAINT "ProductUnit_name_key" UNIQUE ("name"),
    CONSTRAINT "ProductUnit_decimalPlaces_check"
        CHECK ("decimalPlaces" >= 0 AND "decimalPlaces" <= 6)
);

-- ------------------------------------------------------------
-- TAX RATE
-- ------------------------------------------------------------

CREATE TABLE "TaxRate" (
    "id"          SERIAL PRIMARY KEY,
    "code"        VARCHAR(10) NOT NULL,
    "name"        VARCHAR(50) NOT NULL,
    "ratePercent" DECIMAL(5,2) NOT NULL,
    "hsnSacCode"  VARCHAR(20),
    "isActive"    BOOLEAN NOT NULL DEFAULT true,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxRate_code_key" UNIQUE ("code"),
    CONSTRAINT "TaxRate_ratePercent_check"
        CHECK ("ratePercent" >= 0 AND "ratePercent" <= 100)
);

-- ------------------------------------------------------------
-- STOCK CATEGORY
-- ------------------------------------------------------------

CREATE TABLE "StockCategory" (
    "id"        SERIAL PRIMARY KEY,
    "code"      VARCHAR(10) NOT NULL,
    "name"      VARCHAR(50) NOT NULL,
    "isActive"  BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockCategory_code_key" UNIQUE ("code"),
    CONSTRAINT "StockCategory_name_key" UNIQUE ("name")
);

-- ------------------------------------------------------------
-- LOCATION (self-referencing hierarchy, same shape as GeneralLedger)
-- ------------------------------------------------------------

CREATE TABLE "Location" (
    "id"        SERIAL PRIMARY KEY,
    "code"      VARCHAR(10) NOT NULL,
    "name"      VARCHAR(50) NOT NULL,
    "parentId"  INTEGER,
    "isActive"  BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Location_code_key" UNIQUE ("code"),
    CONSTRAINT "Location_parentId_fkey"
        FOREIGN KEY ("parentId") REFERENCES "Location"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Location_no_self_parent_check"
        CHECK ("parentId" IS NULL OR "parentId" <> "id")
);

CREATE INDEX "Location_parentId_idx" ON "Location"("parentId");

-- ------------------------------------------------------------
-- PRODUCT GROUP / SUBGROUP
-- ------------------------------------------------------------

CREATE TABLE "ProductGroup" (
    "id"        SERIAL PRIMARY KEY,
    "code"      VARCHAR(10) NOT NULL,
    "name"      VARCHAR(50) NOT NULL,
    "isActive"  BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductGroup_code_key" UNIQUE ("code"),
    CONSTRAINT "ProductGroup_name_key" UNIQUE ("name")
);

CREATE TABLE "ProductSubGroup" (
    "id"             SERIAL PRIMARY KEY,
    "code"           VARCHAR(10) NOT NULL,
    "name"           VARCHAR(50) NOT NULL,
    "productGroupId" INTEGER NOT NULL,
    "isActive"       BOOLEAN NOT NULL DEFAULT true,
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"      TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductSubGroup_productGroupId_fkey"
        FOREIGN KEY ("productGroupId") REFERENCES "ProductGroup"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE,

    CONSTRAINT "ProductSubGroup_productGroupId_code_key" UNIQUE ("productGroupId", "code"),
    CONSTRAINT "ProductSubGroup_productGroupId_name_key" UNIQUE ("productGroupId", "name")
);

-- No standalone index on productGroupId: both composite unique
-- indexes above already lead with that column (same convention as
-- the AccountSubGroup/SubArea index cleanup in 20260909012133_).

-- ------------------------------------------------------------
-- PRODUCT — header row for all five types
-- ------------------------------------------------------------

CREATE TABLE "Product" (
    "id"                SERIAL PRIMARY KEY,
    "code"              VARCHAR(10) NOT NULL,
    "description"       VARCHAR(256) NOT NULL,
    "shortName"         VARCHAR(30),
    "barcode"           VARCHAR(64),
    "type"              "ProductType" NOT NULL,
    "productSubGroupId" INTEGER NOT NULL,
    "isActive"          BOOLEAN NOT NULL DEFAULT true,
    "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"         TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_code_key" UNIQUE ("code"),
    CONSTRAINT "Product_barcode_key" UNIQUE ("barcode"),

    CONSTRAINT "Product_productSubGroupId_fkey"
        FOREIGN KEY ("productSubGroupId") REFERENCES "ProductSubGroup"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "Product_productSubGroupId_idx" ON "Product"("productSubGroupId");
CREATE INDEX "Product_type_idx" ON "Product"("type");
CREATE INDEX "Product_type_isActive_idx" ON "Product"("type", "isActive");
CREATE INDEX "Product_description_idx" ON "Product"("description");

-- ------------------------------------------------------------
-- STOCK DETAIL
-- ------------------------------------------------------------

CREATE TABLE "StockDetail" (
    "id"                 SERIAL PRIMARY KEY,
    "productId"          INTEGER NOT NULL,
    "baseUnitId"         INTEGER NOT NULL,
    "stockCategoryId"    INTEGER,
    "defaultLocationId"  INTEGER,
    "taxRateId"          INTEGER,
    "valuationMethod"    "ValuationMethod" NOT NULL DEFAULT 'WEIGHTED_AVERAGE',
    "tracksBatch"        BOOLEAN NOT NULL DEFAULT false,
    "tracksExpiry"       BOOLEAN NOT NULL DEFAULT false,

    "purchaseRate"       DECIMAL(18,6),
    "salesRate"          DECIMAL(18,6),
    "mrp"                DECIMAL(18,6),
    "tradePrice"         DECIMAL(18,6),

    "minStock"           DECIMAL(18,6),
    "maxStock"           DECIMAL(18,6),
    "reorderLevel"       DECIMAL(18,6),
    "reorderQty"         DECIMAL(18,6),

    "openingGLId"        INTEGER,
    "closingPLGLId"      INTEGER,
    "closingBSGLId"      INTEGER,
    "purchaseGLId"       INTEGER,
    "purchaseReturnGLId" INTEGER,
    "salesGLId"          INTEGER,
    "salesReturnGLId"    INTEGER,

    "defaultVendorId"    INTEGER,

    "createdAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"          TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockDetail_productId_key" UNIQUE ("productId"),

    CONSTRAINT "StockDetail_productId_fkey"
        FOREIGN KEY ("productId") REFERENCES "Product"("id")
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StockDetail_baseUnitId_fkey"
        FOREIGN KEY ("baseUnitId") REFERENCES "ProductUnit"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "StockDetail_stockCategoryId_fkey"
        FOREIGN KEY ("stockCategoryId") REFERENCES "StockCategory"("id")
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "StockDetail_defaultLocationId_fkey"
        FOREIGN KEY ("defaultLocationId") REFERENCES "Location"("id")
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "StockDetail_taxRateId_fkey"
        FOREIGN KEY ("taxRateId") REFERENCES "TaxRate"("id")
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "StockDetail_openingGLId_fkey"
        FOREIGN KEY ("openingGLId") REFERENCES "GeneralLedger"("id")
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "StockDetail_closingPLGLId_fkey"
        FOREIGN KEY ("closingPLGLId") REFERENCES "GeneralLedger"("id")
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "StockDetail_closingBSGLId_fkey"
        FOREIGN KEY ("closingBSGLId") REFERENCES "GeneralLedger"("id")
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "StockDetail_purchaseGLId_fkey"
        FOREIGN KEY ("purchaseGLId") REFERENCES "GeneralLedger"("id")
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "StockDetail_purchaseReturnGLId_fkey"
        FOREIGN KEY ("purchaseReturnGLId") REFERENCES "GeneralLedger"("id")
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "StockDetail_salesGLId_fkey"
        FOREIGN KEY ("salesGLId") REFERENCES "GeneralLedger"("id")
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "StockDetail_salesReturnGLId_fkey"
        FOREIGN KEY ("salesReturnGLId") REFERENCES "GeneralLedger"("id")
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "StockDetail_defaultVendorId_fkey"
        FOREIGN KEY ("defaultVendorId") REFERENCES "Party"("id")
        ON DELETE SET NULL ON UPDATE CASCADE,

    CONSTRAINT "StockDetail_purchaseRate_check" CHECK ("purchaseRate" IS NULL OR "purchaseRate" >= 0),
    CONSTRAINT "StockDetail_salesRate_check"    CHECK ("salesRate" IS NULL OR "salesRate" >= 0),
    CONSTRAINT "StockDetail_mrp_check"          CHECK ("mrp" IS NULL OR "mrp" >= 0),
    CONSTRAINT "StockDetail_tradePrice_check"   CHECK ("tradePrice" IS NULL OR "tradePrice" >= 0),
    CONSTRAINT "StockDetail_minStock_check"     CHECK ("minStock" IS NULL OR "minStock" >= 0),
    CONSTRAINT "StockDetail_maxStock_check"     CHECK ("maxStock" IS NULL OR "maxStock" >= 0),
    CONSTRAINT "StockDetail_reorderLevel_check" CHECK ("reorderLevel" IS NULL OR "reorderLevel" >= 0),
    CONSTRAINT "StockDetail_reorderQty_check"   CHECK ("reorderQty" IS NULL OR "reorderQty" >= 0),
    CONSTRAINT "StockDetail_min_le_max_stock_check"
        CHECK ("minStock" IS NULL OR "maxStock" IS NULL OR "minStock" <= "maxStock"),
    CONSTRAINT "StockDetail_reorder_le_max_stock_check"
        CHECK ("reorderLevel" IS NULL OR "maxStock" IS NULL OR "reorderLevel" <= "maxStock")
);

CREATE INDEX "StockDetail_baseUnitId_idx" ON "StockDetail"("baseUnitId");
CREATE INDEX "StockDetail_stockCategoryId_idx" ON "StockDetail"("stockCategoryId");
CREATE INDEX "StockDetail_defaultLocationId_idx" ON "StockDetail"("defaultLocationId");
CREATE INDEX "StockDetail_defaultVendorId_idx" ON "StockDetail"("defaultVendorId");
CREATE INDEX "StockDetail_taxRateId_idx" ON "StockDetail"("taxRateId");
CREATE INDEX "StockDetail_openingGLId_idx" ON "StockDetail"("openingGLId");
CREATE INDEX "StockDetail_closingPLGLId_idx" ON "StockDetail"("closingPLGLId");
CREATE INDEX "StockDetail_closingBSGLId_idx" ON "StockDetail"("closingBSGLId");
CREATE INDEX "StockDetail_purchaseGLId_idx" ON "StockDetail"("purchaseGLId");
CREATE INDEX "StockDetail_purchaseReturnGLId_idx" ON "StockDetail"("purchaseReturnGLId");
CREATE INDEX "StockDetail_salesGLId_idx" ON "StockDetail"("salesGLId");
CREATE INDEX "StockDetail_salesReturnGLId_idx" ON "StockDetail"("salesReturnGLId");

-- ------------------------------------------------------------
-- ALTERNATE UNIT
-- ------------------------------------------------------------

CREATE TABLE "AlternateUnit" (
    "id"               SERIAL PRIMARY KEY,
    "stockDetailId"    INTEGER NOT NULL,
    "unitId"           INTEGER NOT NULL,
    "conversionFactor" DECIMAL(18,6) NOT NULL,

    CONSTRAINT "AlternateUnit_stockDetailId_fkey"
        FOREIGN KEY ("stockDetailId") REFERENCES "StockDetail"("id")
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AlternateUnit_unitId_fkey"
        FOREIGN KEY ("unitId") REFERENCES "ProductUnit"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE,

    CONSTRAINT "AlternateUnit_stockDetailId_unitId_key" UNIQUE ("stockDetailId", "unitId"),
    CONSTRAINT "AlternateUnit_conversionFactor_check" CHECK ("conversionFactor" > 0)
);

CREATE INDEX "AlternateUnit_unitId_idx" ON "AlternateUnit"("unitId");

-- ------------------------------------------------------------
-- NON-STOCK DETAIL
-- ------------------------------------------------------------

CREATE TABLE "NonStockDetail" (
    "id"           SERIAL PRIMARY KEY,
    "productId"    INTEGER NOT NULL,
    "unitId"       INTEGER NOT NULL,
    "taxRateId"    INTEGER,
    "salesGLId"    INTEGER NOT NULL,
    "purchaseGLId" INTEGER NOT NULL,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NonStockDetail_productId_key" UNIQUE ("productId"),

    CONSTRAINT "NonStockDetail_productId_fkey"
        FOREIGN KEY ("productId") REFERENCES "Product"("id")
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "NonStockDetail_unitId_fkey"
        FOREIGN KEY ("unitId") REFERENCES "ProductUnit"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "NonStockDetail_taxRateId_fkey"
        FOREIGN KEY ("taxRateId") REFERENCES "TaxRate"("id")
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "NonStockDetail_salesGLId_fkey"
        FOREIGN KEY ("salesGLId") REFERENCES "GeneralLedger"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "NonStockDetail_purchaseGLId_fkey"
        FOREIGN KEY ("purchaseGLId") REFERENCES "GeneralLedger"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "NonStockDetail_unitId_idx" ON "NonStockDetail"("unitId");
CREATE INDEX "NonStockDetail_taxRateId_idx" ON "NonStockDetail"("taxRateId");
CREATE INDEX "NonStockDetail_salesGLId_idx" ON "NonStockDetail"("salesGLId");
CREATE INDEX "NonStockDetail_purchaseGLId_idx" ON "NonStockDetail"("purchaseGLId");

-- ------------------------------------------------------------
-- SERVICE DETAIL
-- ------------------------------------------------------------

CREATE TABLE "ServiceDetail" (
    "id"           SERIAL PRIMARY KEY,
    "productId"    INTEGER NOT NULL,
    "unitId"       INTEGER,
    "taxRateId"    INTEGER,
    "salesGLId"    INTEGER NOT NULL,
    "purchaseGLId" INTEGER NOT NULL,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceDetail_productId_key" UNIQUE ("productId"),

    CONSTRAINT "ServiceDetail_productId_fkey"
        FOREIGN KEY ("productId") REFERENCES "Product"("id")
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ServiceDetail_unitId_fkey"
        FOREIGN KEY ("unitId") REFERENCES "ProductUnit"("id")
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ServiceDetail_taxRateId_fkey"
        FOREIGN KEY ("taxRateId") REFERENCES "TaxRate"("id")
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ServiceDetail_salesGLId_fkey"
        FOREIGN KEY ("salesGLId") REFERENCES "GeneralLedger"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ServiceDetail_purchaseGLId_fkey"
        FOREIGN KEY ("purchaseGLId") REFERENCES "GeneralLedger"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "ServiceDetail_unitId_idx" ON "ServiceDetail"("unitId");
CREATE INDEX "ServiceDetail_taxRateId_idx" ON "ServiceDetail"("taxRateId");
CREATE INDEX "ServiceDetail_salesGLId_idx" ON "ServiceDetail"("salesGLId");
CREATE INDEX "ServiceDetail_purchaseGLId_idx" ON "ServiceDetail"("purchaseGLId");

-- ------------------------------------------------------------
-- FIXED ASSET DETAIL
-- ------------------------------------------------------------

CREATE TABLE "FixedAssetDetail" (
    "id"                      SERIAL PRIMARY KEY,
    "productId"               INTEGER NOT NULL,
    "assetGLId"               INTEGER NOT NULL,
    "accumulatedDeprGLId"     INTEGER NOT NULL,
    "depreciationExpenseGLId" INTEGER NOT NULL,
    "locationId"              INTEGER,
    "purchaseDate"            DATE,
    "originalCost"            DECIMAL(18,6),
    "salvageValue"            DECIMAL(18,6) NOT NULL DEFAULT 0,
    "usefulLifeYears"         INTEGER,
    "depreciationMethod"      "DepreciationMethod" NOT NULL DEFAULT 'STRAIGHT_LINE',
    "depreciationRatePercent" DECIMAL(5,2),
    "accumulatedDepreciation" DECIMAL(18,6) NOT NULL DEFAULT 0,
    "createdAt"               TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"               TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FixedAssetDetail_productId_key" UNIQUE ("productId"),

    CONSTRAINT "FixedAssetDetail_productId_fkey"
        FOREIGN KEY ("productId") REFERENCES "Product"("id")
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FixedAssetDetail_assetGLId_fkey"
        FOREIGN KEY ("assetGLId") REFERENCES "GeneralLedger"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "FixedAssetDetail_accumulatedDeprGLId_fkey"
        FOREIGN KEY ("accumulatedDeprGLId") REFERENCES "GeneralLedger"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "FixedAssetDetail_depreciationExpenseGLId_fkey"
        FOREIGN KEY ("depreciationExpenseGLId") REFERENCES "GeneralLedger"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "FixedAssetDetail_locationId_fkey"
        FOREIGN KEY ("locationId") REFERENCES "Location"("id")
        ON DELETE SET NULL ON UPDATE CASCADE,

    CONSTRAINT "FixedAssetDetail_originalCost_check" CHECK ("originalCost" IS NULL OR "originalCost" >= 0),
    CONSTRAINT "FixedAssetDetail_salvageValue_check" CHECK ("salvageValue" >= 0),
    CONSTRAINT "FixedAssetDetail_salvage_le_cost_check"
        CHECK ("originalCost" IS NULL OR "salvageValue" <= "originalCost"),
    CONSTRAINT "FixedAssetDetail_usefulLifeYears_check"
        CHECK ("usefulLifeYears" IS NULL OR "usefulLifeYears" > 0),
    CONSTRAINT "FixedAssetDetail_depreciationRatePercent_check"
        CHECK ("depreciationRatePercent" IS NULL OR ("depreciationRatePercent" >= 0 AND "depreciationRatePercent" <= 100)),
    CONSTRAINT "FixedAssetDetail_accumulatedDepreciation_check"
        CHECK ("accumulatedDepreciation" >= 0)
);

CREATE INDEX "FixedAssetDetail_locationId_idx" ON "FixedAssetDetail"("locationId");
CREATE INDEX "FixedAssetDetail_assetGLId_idx" ON "FixedAssetDetail"("assetGLId");
CREATE INDEX "FixedAssetDetail_accumulatedDeprGLId_idx" ON "FixedAssetDetail"("accumulatedDeprGLId");
CREATE INDEX "FixedAssetDetail_depreciationExpenseGLId_idx" ON "FixedAssetDetail"("depreciationExpenseGLId");

-- ------------------------------------------------------------
-- BUNDLE DETAIL + COMPONENTS
-- ------------------------------------------------------------

CREATE TABLE "BundleDetail" (
    "id"          SERIAL PRIMARY KEY,
    "productId"   INTEGER NOT NULL,
    "salesGLId"   INTEGER NOT NULL,
    "bundlePrice" DECIMAL(18,6),
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BundleDetail_productId_key" UNIQUE ("productId"),

    CONSTRAINT "BundleDetail_productId_fkey"
        FOREIGN KEY ("productId") REFERENCES "Product"("id")
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BundleDetail_salesGLId_fkey"
        FOREIGN KEY ("salesGLId") REFERENCES "GeneralLedger"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE,

    CONSTRAINT "BundleDetail_bundlePrice_check" CHECK ("bundlePrice" IS NULL OR "bundlePrice" >= 0)
);

CREATE INDEX "BundleDetail_salesGLId_idx" ON "BundleDetail"("salesGLId");

CREATE TABLE "BundleComponent" (
    "id"                 SERIAL PRIMARY KEY,
    "bundleDetailId"     INTEGER NOT NULL,
    "componentProductId" INTEGER NOT NULL,
    "quantity"           DECIMAL(18,6) NOT NULL,

    CONSTRAINT "BundleComponent_bundleDetailId_fkey"
        FOREIGN KEY ("bundleDetailId") REFERENCES "BundleDetail"("id")
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BundleComponent_componentProductId_fkey"
        FOREIGN KEY ("componentProductId") REFERENCES "Product"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE,

    CONSTRAINT "BundleComponent_bundleDetailId_componentProductId_key"
        UNIQUE ("bundleDetailId", "componentProductId"),
    CONSTRAINT "BundleComponent_quantity_check" CHECK ("quantity" > 0)
);

CREATE INDEX "BundleComponent_componentProductId_idx" ON "BundleComponent"("componentProductId");

-- ============================================================
-- AUDIT TRIGGERS
-- Reuses fn_audit_trigger() defined in the init migration —
-- attach it to every new table (AuditLog itself stays excluded).
-- ============================================================

CREATE TRIGGER trg_audit_product_group
AFTER INSERT OR UPDATE OR DELETE ON "ProductGroup"
FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();

CREATE TRIGGER trg_audit_product_sub_group
AFTER INSERT OR UPDATE OR DELETE ON "ProductSubGroup"
FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();

CREATE TRIGGER trg_audit_product_unit
AFTER INSERT OR UPDATE OR DELETE ON "ProductUnit"
FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();

CREATE TRIGGER trg_audit_tax_rate
AFTER INSERT OR UPDATE OR DELETE ON "TaxRate"
FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();

CREATE TRIGGER trg_audit_stock_category
AFTER INSERT OR UPDATE OR DELETE ON "StockCategory"
FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();

CREATE TRIGGER trg_audit_location
AFTER INSERT OR UPDATE OR DELETE ON "Location"
FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();

CREATE TRIGGER trg_audit_product
AFTER INSERT OR UPDATE OR DELETE ON "Product"
FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();

CREATE TRIGGER trg_audit_stock_detail
AFTER INSERT OR UPDATE OR DELETE ON "StockDetail"
FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();

CREATE TRIGGER trg_audit_alternate_unit
AFTER INSERT OR UPDATE OR DELETE ON "AlternateUnit"
FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();

CREATE TRIGGER trg_audit_non_stock_detail
AFTER INSERT OR UPDATE OR DELETE ON "NonStockDetail"
FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();

CREATE TRIGGER trg_audit_service_detail
AFTER INSERT OR UPDATE OR DELETE ON "ServiceDetail"
FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();

CREATE TRIGGER trg_audit_fixed_asset_detail
AFTER INSERT OR UPDATE OR DELETE ON "FixedAssetDetail"
FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();

CREATE TRIGGER trg_audit_bundle_detail
AFTER INSERT OR UPDATE OR DELETE ON "BundleDetail"
FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();

CREATE TRIGGER trg_audit_bundle_component
AFTER INSERT OR UPDATE OR DELETE ON "BundleComponent"
FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();

-- ============================================================
-- PRODUCT CATALOG INTEGRITY TRIGGERS
-- Product.type is a discriminator over five mutually-exclusive
-- detail tables. Prisma's schema language can express the 1:1
-- FK to each detail table, but not "type must match" or "exactly
-- one detail row total" — both are cross-table/cross-row rules,
-- so they're hand-enforced here, same philosophy as the voucher
-- integrity triggers above.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Product.type must match the detail table being written to.
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION fn_check_product_type_match()
RETURNS TRIGGER AS $$
DECLARE
    v_type "ProductType";
    v_expected "ProductType";
BEGIN
    v_expected := CASE TG_TABLE_NAME
        WHEN 'StockDetail'      THEN 'STOCK'::"ProductType"
        WHEN 'NonStockDetail'   THEN 'NON_STOCK'::"ProductType"
        WHEN 'ServiceDetail'    THEN 'SERVICE'::"ProductType"
        WHEN 'FixedAssetDetail' THEN 'FIXED_ASSET'::"ProductType"
        WHEN 'BundleDetail'     THEN 'BUNDLE'::"ProductType"
    END;

    SELECT "type" INTO v_type FROM "Product" WHERE "id" = NEW."productId";

    IF v_type IS DISTINCT FROM v_expected THEN
        RAISE EXCEPTION 'Product % has type % and cannot have a % row (expected type %)',
            NEW."productId", v_type, TG_TABLE_NAME, v_expected;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_stock_detail_type_match
BEFORE INSERT OR UPDATE ON "StockDetail"
FOR EACH ROW EXECUTE FUNCTION fn_check_product_type_match();

CREATE TRIGGER trg_non_stock_detail_type_match
BEFORE INSERT OR UPDATE ON "NonStockDetail"
FOR EACH ROW EXECUTE FUNCTION fn_check_product_type_match();

CREATE TRIGGER trg_service_detail_type_match
BEFORE INSERT OR UPDATE ON "ServiceDetail"
FOR EACH ROW EXECUTE FUNCTION fn_check_product_type_match();

CREATE TRIGGER trg_fixed_asset_detail_type_match
BEFORE INSERT OR UPDATE ON "FixedAssetDetail"
FOR EACH ROW EXECUTE FUNCTION fn_check_product_type_match();

CREATE TRIGGER trg_bundle_detail_type_match
BEFORE INSERT OR UPDATE ON "BundleDetail"
FOR EACH ROW EXECUTE FUNCTION fn_check_product_type_match();

-- ------------------------------------------------------------
-- 2. Exactly one detail row per product, across all five tables.
-- Each detail table already has a UNIQUE productId, so the only
-- remaining risk is a product ending up with rows in TWO
-- different detail tables (e.g. both StockDetail and BundleDetail
-- for the same productId). Checked BEFORE INSERT — detail rows
-- are created once, atomically, alongside the product, not built
-- up incrementally like voucher lines, so no deferral is needed.
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION fn_check_product_single_detail()
RETURNS TRIGGER AS $$
DECLARE
    v_other_count INTEGER;
BEGIN
    SELECT
        (SELECT COUNT(*) FROM "StockDetail"      WHERE "productId" = NEW."productId" AND TG_TABLE_NAME <> 'StockDetail') +
        (SELECT COUNT(*) FROM "NonStockDetail"   WHERE "productId" = NEW."productId" AND TG_TABLE_NAME <> 'NonStockDetail') +
        (SELECT COUNT(*) FROM "ServiceDetail"    WHERE "productId" = NEW."productId" AND TG_TABLE_NAME <> 'ServiceDetail') +
        (SELECT COUNT(*) FROM "FixedAssetDetail" WHERE "productId" = NEW."productId" AND TG_TABLE_NAME <> 'FixedAssetDetail') +
        (SELECT COUNT(*) FROM "BundleDetail"     WHERE "productId" = NEW."productId" AND TG_TABLE_NAME <> 'BundleDetail')
    INTO v_other_count;

    IF v_other_count > 0 THEN
        RAISE EXCEPTION 'Product % already has a detail row in another product-type table; a product may have exactly one detail row',
            NEW."productId";
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_stock_detail_single
BEFORE INSERT ON "StockDetail"
FOR EACH ROW EXECUTE FUNCTION fn_check_product_single_detail();

CREATE TRIGGER trg_non_stock_detail_single
BEFORE INSERT ON "NonStockDetail"
FOR EACH ROW EXECUTE FUNCTION fn_check_product_single_detail();

CREATE TRIGGER trg_service_detail_single
BEFORE INSERT ON "ServiceDetail"
FOR EACH ROW EXECUTE FUNCTION fn_check_product_single_detail();

CREATE TRIGGER trg_fixed_asset_detail_single
BEFORE INSERT ON "FixedAssetDetail"
FOR EACH ROW EXECUTE FUNCTION fn_check_product_single_detail();

CREATE TRIGGER trg_bundle_detail_single
BEFORE INSERT ON "BundleDetail"
FOR EACH ROW EXECUTE FUNCTION fn_check_product_single_detail();

-- ------------------------------------------------------------
-- 3. AlternateUnit cannot duplicate the parent StockDetail's
-- base unit (a "1 PCS = 1 PCS" alternate unit is meaningless
-- and would create an ambiguous conversion path).
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION fn_check_alternate_unit_not_base()
RETURNS TRIGGER AS $$
DECLARE
    v_base_unit_id INTEGER;
BEGIN
    SELECT "baseUnitId" INTO v_base_unit_id
    FROM "StockDetail" WHERE "id" = NEW."stockDetailId";

    IF NEW."unitId" = v_base_unit_id THEN
        RAISE EXCEPTION 'AlternateUnit.unitId (%) cannot equal the StockDetail''s own baseUnitId', NEW."unitId";
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_alternate_unit_not_base
BEFORE INSERT OR UPDATE ON "AlternateUnit"
FOR EACH ROW EXECUTE FUNCTION fn_check_alternate_unit_not_base();

-- ------------------------------------------------------------
-- 4. BundleComponent: no self-reference, no nested bundles.
-- A bundle cannot list its own product as a component, and a
-- component product cannot itself be of type BUNDLE — this
-- keeps bundle composition flat and sidesteps cycle detection
-- entirely rather than trying to catch cycles at N levels deep.
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION fn_check_bundle_component_valid()
RETURNS TRIGGER AS $$
DECLARE
    v_bundle_product_id INTEGER;
    v_component_type "ProductType";
BEGIN
    SELECT "productId" INTO v_bundle_product_id
    FROM "BundleDetail" WHERE "id" = NEW."bundleDetailId";

    IF NEW."componentProductId" = v_bundle_product_id THEN
        RAISE EXCEPTION 'BundleComponent cannot reference its own bundle product (%) as a component',
            v_bundle_product_id;
    END IF;

    SELECT "type" INTO v_component_type
    FROM "Product" WHERE "id" = NEW."componentProductId";

    IF v_component_type = 'BUNDLE' THEN
        RAISE EXCEPTION 'BundleComponent.componentProductId (%) is itself a BUNDLE-type product; nested bundles are not allowed',
            NEW."componentProductId";
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_bundle_component_valid
BEFORE INSERT OR UPDATE ON "BundleComponent"
FOR EACH ROW EXECUTE FUNCTION fn_check_bundle_component_valid();

-- >>> 20260915120000_add_fiscal_year_and_company
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

-- >>> 20260915180000_add_opening_balance
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

-- >>> 20260915190000_add_multi_tenant_company_branch
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

-- >>> 20260920031016_journalvoucher
-- RenameIndex
ALTER INDEX "OpeningBalance_fy_branch_gl_subledger_idx" RENAME TO "OpeningBalance_fiscalYearId_branchId_generalLedgerId_subLed_idx";
