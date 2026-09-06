-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('ASSETS', 'LIABILITIES', 'CAPITAL', 'INCOME', 'EXPENSES');

-- CreateEnum
CREATE TYPE "RecordStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateTable
CREATE TABLE "account_groups" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "accountType" "AccountType" NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sub_groups" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "accountGroupId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sub_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ledgers" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "subGroupId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ledgers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "account_groups_code_key" ON "account_groups"("code");

-- CreateIndex
CREATE INDEX "account_groups_accountType_idx" ON "account_groups"("accountType");

-- CreateIndex
CREATE UNIQUE INDEX "sub_groups_code_key" ON "sub_groups"("code");

-- CreateIndex
CREATE INDEX "sub_groups_accountGroupId_idx" ON "sub_groups"("accountGroupId");

-- CreateIndex
CREATE UNIQUE INDEX "ledgers_code_key" ON "ledgers"("code");

-- CreateIndex
CREATE INDEX "ledgers_subGroupId_idx" ON "ledgers"("subGroupId");

-- AddForeignKey
ALTER TABLE "sub_groups" ADD CONSTRAINT "sub_groups_accountGroupId_fkey" FOREIGN KEY ("accountGroupId") REFERENCES "account_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledgers" ADD CONSTRAINT "ledgers_subGroupId_fkey" FOREIGN KEY ("subGroupId") REFERENCES "sub_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
