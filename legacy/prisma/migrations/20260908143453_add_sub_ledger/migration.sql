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
