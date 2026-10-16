import { pgTable, type AnyPgColumn, type PgTableExtraConfigValue, index, foreignKey, unique, serial, varchar, integer, boolean, timestamp, numeric, bigserial, text, jsonb, date, check, uniqueIndex, pgView, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const accountType = pgEnum("AccountType", ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'])
export const auditAction = pgEnum("AuditAction", ['INSERT', 'UPDATE', 'DELETE'])
export const businessType = pgEnum("BusinessType", ['SOLE_PROPRIETORSHIP', 'PARTNERSHIP', 'PRIVATE_LIMITED', 'PUBLIC_LIMITED', 'OTHER'])
export const calendarPreference = pgEnum("CalendarPreference", ['BS', 'AD'])
export const companyRole = pgEnum("CompanyRole", ['ADMIN', 'ACCOUNTANT', 'VIEWER'])
export const depreciationMethod = pgEnum("DepreciationMethod", ['STRAIGHT_LINE', 'WRITTEN_DOWN_VALUE'])
export const documentType = pgEnum("DocumentType", ['CASH_BANK_VOUCHER', 'JOURNAL_VOUCHER', 'SALES_INVOICE', 'PURCHASE_BILL'])
export const glType = pgEnum("GLType", ['CUSTOMER', 'VENDOR', 'BOTH', 'OTHER'])
export const instrumentType = pgEnum("InstrumentType", ['CHEQUE', 'RTGS', 'ONLINE_TRANSFER', 'OTHER'])
export const normalBalance = pgEnum("NormalBalance", ['DEBIT', 'CREDIT'])
export const productType = pgEnum("ProductType", ['STOCK', 'NON_STOCK', 'SERVICE', 'FIXED_ASSET', 'BUNDLE'])
export const valuationMethod = pgEnum("ValuationMethod", ['FIFO', 'WEIGHTED_AVERAGE', 'STANDARD_COST'])


export const generalLedger = pgTable("GeneralLedger", {
	id: serial().primaryKey().notNull(),
	code: varchar({ length: 20 }).notNull(),
	name: varchar({ length: 100 }).notNull(),
	accountSubGroupId: integer().notNull(),
	normalBalance: normalBalance().notNull(),
	glType: glType().default('OTHER').notNull(),
	parentId: integer(),
	isCashOrBank: boolean().default(false).notNull(),
	postsToCashBook: boolean().default(false).notNull(),
	requiresSubLedger: boolean().default(false).notNull(),
	allowDocAdjust: boolean().default(false).notNull(),
	isActive: boolean().default(true).notNull(),
	subAreaId: integer(),
	agentId: integer(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
	companyId: integer().notNull(),
}, (table): PgTableExtraConfigValue[] => [
	index("GeneralLedger_accountSubGroupId_idx").using("btree", table.accountSubGroupId.asc().nullsLast().op("int4_ops")),
	index("GeneralLedger_agentId_idx").using("btree", table.agentId.asc().nullsLast().op("int4_ops")),
	index("GeneralLedger_companyId_idx").using("btree", table.companyId.asc().nullsLast().op("int4_ops")),
	index("GeneralLedger_glType_idx").using("btree", table.glType.asc().nullsLast().op("enum_ops")),
	index("GeneralLedger_parentId_idx").using("btree", table.parentId.asc().nullsLast().op("int4_ops")),
	index("GeneralLedger_subAreaId_idx").using("btree", table.subAreaId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.accountSubGroupId],
			foreignColumns: [accountSubGroup.id],
			name: "GeneralLedger_accountSubGroupId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
	foreignKey({
			columns: [table.parentId],
			foreignColumns: [table.id],
			name: "GeneralLedger_parentId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
	foreignKey({
			columns: [table.subAreaId],
			foreignColumns: [subArea.id],
			name: "GeneralLedger_subAreaId_fkey"
		}).onUpdate("cascade").onDelete("set null"),
	foreignKey({
			columns: [table.agentId],
			foreignColumns: [agent.id],
			name: "GeneralLedger_agentId_fkey"
		}).onUpdate("cascade").onDelete("set null"),
	foreignKey({
			columns: [table.companyId],
			foreignColumns: [company.id],
			name: "GeneralLedger_companyId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
	unique("GeneralLedger_companyId_code_key").on(table.code, table.companyId),
]);

export const accountSubGroup = pgTable("AccountSubGroup", {
	id: serial().primaryKey().notNull(),
	code: varchar({ length: 10 }).notNull(),
	description: varchar({ length: 50 }).notNull(),
	accountGroupId: integer().notNull(),
	isActive: boolean().default(true).notNull(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
}, (table): PgTableExtraConfigValue[] => [
	foreignKey({
			columns: [table.accountGroupId],
			foreignColumns: [accountGroup.id],
			name: "AccountSubGroup_accountGroupId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
	unique("AccountSubGroup_accountGroupId_code_key").on(table.code, table.accountGroupId),
	unique("AccountSubGroup_accountGroupId_description_key").on(table.description, table.accountGroupId),
]);

export const subArea = pgTable("SubArea", {
	id: serial().primaryKey().notNull(),
	code: varchar({ length: 10 }).notNull(),
	name: varchar({ length: 50 }).notNull(),
	shortName: varchar({ length: 10 }).notNull(),
	areaId: integer().notNull(),
	isActive: boolean().default(true).notNull(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
}, (table): PgTableExtraConfigValue[] => [
	foreignKey({
			columns: [table.areaId],
			foreignColumns: [area.id],
			name: "SubArea_areaId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
	unique("SubArea_areaId_code_key").on(table.code, table.areaId),
	unique("SubArea_areaId_name_key").on(table.name, table.areaId),
	unique("SubArea_areaId_shortName_key").on(table.shortName, table.areaId),
]);

export const agent = pgTable("Agent", {
	id: serial().primaryKey().notNull(),
	code: varchar({ length: 10 }).notNull(),
	name: varchar({ length: 100 }).notNull(),
	phone: varchar({ length: 25 }),
	isActive: boolean().default(true).notNull(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
	companyId: integer().notNull(),
}, (table): PgTableExtraConfigValue[] => [
	index("Agent_companyId_idx").using("btree", table.companyId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.companyId],
			foreignColumns: [company.id],
			name: "Agent_companyId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
	unique("Agent_companyId_code_key").on(table.code, table.companyId),
]);

export const accountGroup = pgTable("AccountGroup", {
	id: serial().primaryKey().notNull(),
	code: varchar({ length: 10 }).notNull(),
	description: varchar({ length: 50 }).notNull(),
	type: accountType().notNull(),
	isActive: boolean().default(true).notNull(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
	companyId: integer().notNull(),
}, (table): PgTableExtraConfigValue[] => [
	index("AccountGroup_companyId_idx").using("btree", table.companyId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.companyId],
			foreignColumns: [company.id],
			name: "AccountGroup_companyId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
	unique("AccountGroup_companyId_code_key").on(table.code, table.companyId),
	unique("AccountGroup_companyId_description_key").on(table.description, table.companyId),
]);

export const area = pgTable("Area", {
	id: serial().primaryKey().notNull(),
	code: varchar({ length: 10 }).notNull(),
	name: varchar({ length: 50 }).notNull(),
	shortName: varchar({ length: 10 }).notNull(),
	isActive: boolean().default(true).notNull(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
	companyId: integer().notNull(),
}, (table): PgTableExtraConfigValue[] => [
	index("Area_companyId_idx").using("btree", table.companyId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.companyId],
			foreignColumns: [company.id],
			name: "Area_companyId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
	unique("Area_companyId_code_key").on(table.code, table.companyId),
	unique("Area_companyId_name_key").on(table.name, table.companyId),
	unique("Area_companyId_shortName_key").on(table.shortName, table.companyId),
]);

export const customerDetail = pgTable("CustomerDetail", {
	id: serial().primaryKey().notNull(),
	partyId: integer().notNull(),
	creditLimit: numeric({ precision: 18, scale:  6 }),
	creditDays: integer(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
}, (table): PgTableExtraConfigValue[] => [
	foreignKey({
			columns: [table.partyId],
			foreignColumns: [party.id],
			name: "CustomerDetail_partyId_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
	unique("CustomerDetail_partyId_key").on(table.partyId),
]);

export const vendorDetail = pgTable("VendorDetail", {
	id: serial().primaryKey().notNull(),
	partyId: integer().notNull(),
	paymentTermDays: integer(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
}, (table): PgTableExtraConfigValue[] => [
	foreignKey({
			columns: [table.partyId],
			foreignColumns: [party.id],
			name: "VendorDetail_partyId_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
	unique("VendorDetail_partyId_key").on(table.partyId),
]);

export const auditLog = pgTable("AuditLog", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	tableName: varchar({ length: 63 }).notNull(),
	recordId: text().notNull(),
	action: auditAction().notNull(),
	oldData: jsonb(),
	newData: jsonb(),
	changedBy: integer(),
	changedAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table): PgTableExtraConfigValue[] => [
	index("AuditLog_changedAt_idx").using("btree", table.changedAt.asc().nullsLast().op("timestamp_ops")),
	index("AuditLog_tableName_recordId_idx").using("btree", table.tableName.asc().nullsLast().op("text_ops"), table.recordId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.changedBy],
			foreignColumns: [user.id],
			name: "AuditLog_changedBy_fkey"
		}).onUpdate("cascade").onDelete("set null"),
]);

export const journalVoucher = pgTable("JournalVoucher", {
	id: serial().primaryKey().notNull(),
	documentType: documentType().default('JOURNAL_VOUCHER').notNull(),
	voucherNumber: varchar({ length: 30 }).notNull(),
	voucherDate: date().notNull(),
	fiscalYear: varchar({ length: 15 }).notNull(),
	remarks: varchar({ length: 1024 }),
	reversalOfId: integer(),
	isPosted: boolean().default(false).notNull(),
	postedAt: timestamp({ precision: 3, mode: 'string' }),
	postedBy: integer(),
	createdBy: integer(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
	companyId: integer().notNull(),
	branchId: integer().notNull(),
}, (table): PgTableExtraConfigValue[] => [
	index("JournalVoucher_branchId_idx").using("btree", table.branchId.asc().nullsLast().op("int4_ops")),
	index("JournalVoucher_companyId_idx").using("btree", table.companyId.asc().nullsLast().op("int4_ops")),
	index("JournalVoucher_documentType_idx").using("btree", table.documentType.asc().nullsLast().op("enum_ops")),
	index("JournalVoucher_fiscalYear_idx").using("btree", table.fiscalYear.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.reversalOfId],
			foreignColumns: [table.id],
			name: "JournalVoucher_reversalOfId_fkey"
		}).onUpdate("cascade").onDelete("set null"),
	foreignKey({
			columns: [table.postedBy],
			foreignColumns: [user.id],
			name: "JournalVoucher_postedBy_fkey"
		}).onUpdate("cascade").onDelete("set null"),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [user.id],
			name: "JournalVoucher_createdBy_fkey"
		}).onUpdate("cascade").onDelete("set null"),
	foreignKey({
			columns: [table.companyId],
			foreignColumns: [company.id],
			name: "JournalVoucher_companyId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
	foreignKey({
			columns: [table.branchId],
			foreignColumns: [branch.id],
			name: "JournalVoucher_branchId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
	unique("JournalVoucher_branchId_voucherNumber_key").on(table.voucherNumber, table.branchId),
]);

export const journalVoucherLine = pgTable("JournalVoucherLine", {
	id: serial().primaryKey().notNull(),
	journalVoucherId: integer().notNull(),
	lineNumber: integer().notNull(),
	generalLedgerId: integer().notNull(),
	debit: numeric({ precision: 18, scale:  6 }).default('0').notNull(),
	credit: numeric({ precision: 18, scale:  6 }).default('0').notNull(),
	narration: varchar({ length: 500 }),
	agentId: integer(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table): PgTableExtraConfigValue[] => [
	index("JournalVoucherLine_agentId_idx").using("btree", table.agentId.asc().nullsLast().op("int4_ops")),
	index("JournalVoucherLine_generalLedgerId_idx").using("btree", table.generalLedgerId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.journalVoucherId],
			foreignColumns: [journalVoucher.id],
			name: "JournalVoucherLine_journalVoucherId_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
	foreignKey({
			columns: [table.generalLedgerId],
			foreignColumns: [generalLedger.id],
			name: "JournalVoucherLine_generalLedgerId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
	foreignKey({
			columns: [table.agentId],
			foreignColumns: [agent.id],
			name: "JournalVoucherLine_agentId_fkey"
		}).onUpdate("cascade").onDelete("set null"),
	unique("JournalVoucherLine_journalVoucherId_lineNumber_key").on(table.journalVoucherId, table.lineNumber),
	check("JournalVoucherLine_debit_credit_not_both_check", sql`NOT ((debit > (0)::numeric) AND (credit > (0)::numeric))`),
]);

export const cashBankVoucher = pgTable("CashBankVoucher", {
	id: serial().primaryKey().notNull(),
	documentType: documentType().default('CASH_BANK_VOUCHER').notNull(),
	voucherNumber: varchar({ length: 30 }).notNull(),
	voucherDate: date().notNull(),
	fiscalYear: varchar({ length: 15 }).notNull(),
	remarks: varchar({ length: 1024 }),
	reversalOfId: integer(),
	isPosted: boolean().default(false).notNull(),
	postedAt: timestamp({ precision: 3, mode: 'string' }),
	postedBy: integer(),
	createdBy: integer(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
	companyId: integer().notNull(),
	branchId: integer().notNull(),
}, (table): PgTableExtraConfigValue[] => [
	index("CashBankVoucher_branchId_idx").using("btree", table.branchId.asc().nullsLast().op("int4_ops")),
	index("CashBankVoucher_companyId_idx").using("btree", table.companyId.asc().nullsLast().op("int4_ops")),
	index("CashBankVoucher_documentType_idx").using("btree", table.documentType.asc().nullsLast().op("enum_ops")),
	index("CashBankVoucher_fiscalYear_idx").using("btree", table.fiscalYear.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.reversalOfId],
			foreignColumns: [table.id],
			name: "CashBankVoucher_reversalOfId_fkey"
		}).onUpdate("cascade").onDelete("set null"),
	foreignKey({
			columns: [table.postedBy],
			foreignColumns: [user.id],
			name: "CashBankVoucher_postedBy_fkey"
		}).onUpdate("cascade").onDelete("set null"),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [user.id],
			name: "CashBankVoucher_createdBy_fkey"
		}).onUpdate("cascade").onDelete("set null"),
	foreignKey({
			columns: [table.companyId],
			foreignColumns: [company.id],
			name: "CashBankVoucher_companyId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
	foreignKey({
			columns: [table.branchId],
			foreignColumns: [branch.id],
			name: "CashBankVoucher_branchId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
	unique("CashBankVoucher_branchId_voucherNumber_key").on(table.voucherNumber, table.branchId),
]);

export const user = pgTable("User", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 100 }).notNull(),
	email: varchar({ length: 255 }).notNull(),
	isActive: boolean().default(true).notNull(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	calendarPreference: calendarPreference().default('BS').notNull(),
}, (table): PgTableExtraConfigValue[] => [
	unique("User_email_key").on(table.email),
]);

export const cashBankVoucherLine = pgTable("CashBankVoucherLine", {
	id: serial().primaryKey().notNull(),
	cashBankVoucherId: integer().notNull(),
	lineNumber: integer().notNull(),
	generalLedgerId: integer().notNull(),
	debit: numeric({ precision: 18, scale:  6 }).default('0').notNull(),
	credit: numeric({ precision: 18, scale:  6 }).default('0').notNull(),
	narration: varchar({ length: 500 }),
	instrumentType: instrumentType(),
	chequeNumber: varchar({ length: 30 }),
	chequeDate: date(),
	chequeBankName: varchar({ length: 50 }),
	chequeBankBranch: varchar({ length: 50 }),
	isCleared: boolean().default(false).notNull(),
	clearedDate: date(),
	clearedBy: integer(),
	agentId: integer(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table): PgTableExtraConfigValue[] => [
	index("CashBankVoucherLine_agentId_idx").using("btree", table.agentId.asc().nullsLast().op("int4_ops")),
	index("CashBankVoucherLine_chequeNumber_idx").using("btree", table.chequeNumber.asc().nullsLast().op("text_ops")),
	index("CashBankVoucherLine_generalLedgerId_idx").using("btree", table.generalLedgerId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.cashBankVoucherId],
			foreignColumns: [cashBankVoucher.id],
			name: "CashBankVoucherLine_cashBankVoucherId_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
	foreignKey({
			columns: [table.generalLedgerId],
			foreignColumns: [generalLedger.id],
			name: "CashBankVoucherLine_generalLedgerId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
	foreignKey({
			columns: [table.agentId],
			foreignColumns: [agent.id],
			name: "CashBankVoucherLine_agentId_fkey"
		}).onUpdate("cascade").onDelete("set null"),
	foreignKey({
			columns: [table.clearedBy],
			foreignColumns: [user.id],
			name: "CashBankVoucherLine_clearedBy_fkey"
		}).onUpdate("cascade").onDelete("set null"),
	unique("CashBankVoucherLine_cashBankVoucherId_lineNumber_key").on(table.cashBankVoucherId, table.lineNumber),
	check("CashBankVoucherLine_debit_credit_not_both_check", sql`NOT ((debit > (0)::numeric) AND (credit > (0)::numeric))`),
]);

export const productUnit = pgTable("ProductUnit", {
	id: serial().primaryKey().notNull(),
	code: varchar({ length: 10 }).notNull(),
	name: varchar({ length: 50 }).notNull(),
	decimalPlaces: integer().default(0).notNull(),
	isActive: boolean().default(true).notNull(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
	companyId: integer().notNull(),
}, (table): PgTableExtraConfigValue[] => [
	index("ProductUnit_companyId_idx").using("btree", table.companyId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.companyId],
			foreignColumns: [company.id],
			name: "ProductUnit_companyId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
	unique("ProductUnit_companyId_code_key").on(table.code, table.companyId),
	unique("ProductUnit_companyId_name_key").on(table.name, table.companyId),
	check("ProductUnit_decimalPlaces_check", sql`("decimalPlaces" >= 0) AND ("decimalPlaces" <= 6)`),
]);

export const location = pgTable("Location", {
	id: serial().primaryKey().notNull(),
	code: varchar({ length: 10 }).notNull(),
	name: varchar({ length: 50 }).notNull(),
	parentId: integer(),
	isActive: boolean().default(true).notNull(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
	companyId: integer().notNull(),
}, (table): PgTableExtraConfigValue[] => [
	index("Location_companyId_idx").using("btree", table.companyId.asc().nullsLast().op("int4_ops")),
	index("Location_parentId_idx").using("btree", table.parentId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.parentId],
			foreignColumns: [table.id],
			name: "Location_parentId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
	foreignKey({
			columns: [table.companyId],
			foreignColumns: [company.id],
			name: "Location_companyId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
	unique("Location_companyId_code_key").on(table.code, table.companyId),
	check("Location_no_self_parent_check", sql`("parentId" IS NULL) OR ("parentId" <> id)`),
]);

export const subLedger = pgTable("SubLedger", {
	id: serial().primaryKey().notNull(),
	code: varchar({ length: 20 }).notNull(),
	name: varchar({ length: 100 }).notNull(),
	generalLedgerId: integer(),
	partyId: integer(),
	isActive: boolean().default(true).notNull(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
}, (table): PgTableExtraConfigValue[] => [
	index("SubLedger_generalLedgerId_idx").using("btree", table.generalLedgerId.asc().nullsLast().op("int4_ops")),
	index("SubLedger_partyId_idx").using("btree", table.partyId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.generalLedgerId],
			foreignColumns: [generalLedger.id],
			name: "SubLedger_generalLedgerId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
	foreignKey({
			columns: [table.partyId],
			foreignColumns: [party.id],
			name: "SubLedger_partyId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
	unique("SubLedger_code_key").on(table.code),
]);

export const productSubGroup = pgTable("ProductSubGroup", {
	id: serial().primaryKey().notNull(),
	code: varchar({ length: 10 }).notNull(),
	name: varchar({ length: 50 }).notNull(),
	productGroupId: integer().notNull(),
	isActive: boolean().default(true).notNull(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
}, (table): PgTableExtraConfigValue[] => [
	foreignKey({
			columns: [table.productGroupId],
			foreignColumns: [productGroup.id],
			name: "ProductSubGroup_productGroupId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
	unique("ProductSubGroup_productGroupId_code_key").on(table.code, table.productGroupId),
	unique("ProductSubGroup_productGroupId_name_key").on(table.name, table.productGroupId),
]);

export const product = pgTable("Product", {
	id: serial().primaryKey().notNull(),
	code: varchar({ length: 10 }).notNull(),
	description: varchar({ length: 256 }).notNull(),
	shortName: varchar({ length: 30 }),
	barcode: varchar({ length: 64 }),
	type: productType().notNull(),
	productSubGroupId: integer().notNull(),
	isActive: boolean().default(true).notNull(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
	companyId: integer().notNull(),
}, (table): PgTableExtraConfigValue[] => [
	index("Product_companyId_idx").using("btree", table.companyId.asc().nullsLast().op("int4_ops")),
	index("Product_description_idx").using("btree", table.description.asc().nullsLast().op("text_ops")),
	index("Product_productSubGroupId_idx").using("btree", table.productSubGroupId.asc().nullsLast().op("int4_ops")),
	index("Product_type_idx").using("btree", table.type.asc().nullsLast().op("enum_ops")),
	index("Product_type_isActive_idx").using("btree", table.type.asc().nullsLast().op("enum_ops"), table.isActive.asc().nullsLast().op("bool_ops")),
	foreignKey({
			columns: [table.productSubGroupId],
			foreignColumns: [productSubGroup.id],
			name: "Product_productSubGroupId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
	foreignKey({
			columns: [table.companyId],
			foreignColumns: [company.id],
			name: "Product_companyId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
	unique("Product_companyId_code_key").on(table.code, table.companyId),
	unique("Product_companyId_barcode_key").on(table.barcode, table.companyId),
]);

export const stockDetail = pgTable("StockDetail", {
	id: serial().primaryKey().notNull(),
	productId: integer().notNull(),
	baseUnitId: integer().notNull(),
	stockCategoryId: integer(),
	defaultLocationId: integer(),
	taxRateId: integer(),
	valuationMethod: valuationMethod().default('WEIGHTED_AVERAGE').notNull(),
	tracksBatch: boolean().default(false).notNull(),
	tracksExpiry: boolean().default(false).notNull(),
	purchaseRate: numeric({ precision: 18, scale:  6 }),
	salesRate: numeric({ precision: 18, scale:  6 }),
	mrp: numeric({ precision: 18, scale:  6 }),
	tradePrice: numeric({ precision: 18, scale:  6 }),
	minStock: numeric({ precision: 18, scale:  6 }),
	maxStock: numeric({ precision: 18, scale:  6 }),
	reorderLevel: numeric({ precision: 18, scale:  6 }),
	reorderQty: numeric({ precision: 18, scale:  6 }),
	openingGlId: integer("openingGLId"),
	closingPlglId: integer("closingPLGLId"),
	closingBsglId: integer("closingBSGLId"),
	purchaseGlId: integer("purchaseGLId"),
	purchaseReturnGlId: integer("purchaseReturnGLId"),
	salesGlId: integer("salesGLId"),
	salesReturnGlId: integer("salesReturnGLId"),
	defaultVendorId: integer(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
}, (table): PgTableExtraConfigValue[] => [
	index("StockDetail_baseUnitId_idx").using("btree", table.baseUnitId.asc().nullsLast().op("int4_ops")),
	index("StockDetail_closingBSGLId_idx").using("btree", table.closingBsglId.asc().nullsLast().op("int4_ops")),
	index("StockDetail_closingPLGLId_idx").using("btree", table.closingPlglId.asc().nullsLast().op("int4_ops")),
	index("StockDetail_defaultLocationId_idx").using("btree", table.defaultLocationId.asc().nullsLast().op("int4_ops")),
	index("StockDetail_defaultVendorId_idx").using("btree", table.defaultVendorId.asc().nullsLast().op("int4_ops")),
	index("StockDetail_openingGLId_idx").using("btree", table.openingGlId.asc().nullsLast().op("int4_ops")),
	index("StockDetail_purchaseGLId_idx").using("btree", table.purchaseGlId.asc().nullsLast().op("int4_ops")),
	index("StockDetail_purchaseReturnGLId_idx").using("btree", table.purchaseReturnGlId.asc().nullsLast().op("int4_ops")),
	index("StockDetail_salesGLId_idx").using("btree", table.salesGlId.asc().nullsLast().op("int4_ops")),
	index("StockDetail_salesReturnGLId_idx").using("btree", table.salesReturnGlId.asc().nullsLast().op("int4_ops")),
	index("StockDetail_stockCategoryId_idx").using("btree", table.stockCategoryId.asc().nullsLast().op("int4_ops")),
	index("StockDetail_taxRateId_idx").using("btree", table.taxRateId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.closingPlglId],
			foreignColumns: [generalLedger.id],
			name: "StockDetail_closingPLGLId_fkey"
		}).onUpdate("cascade").onDelete("set null"),
	foreignKey({
			columns: [table.closingBsglId],
			foreignColumns: [generalLedger.id],
			name: "StockDetail_closingBSGLId_fkey"
		}).onUpdate("cascade").onDelete("set null"),
	foreignKey({
			columns: [table.purchaseGlId],
			foreignColumns: [generalLedger.id],
			name: "StockDetail_purchaseGLId_fkey"
		}).onUpdate("cascade").onDelete("set null"),
	foreignKey({
			columns: [table.purchaseReturnGlId],
			foreignColumns: [generalLedger.id],
			name: "StockDetail_purchaseReturnGLId_fkey"
		}).onUpdate("cascade").onDelete("set null"),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [product.id],
			name: "StockDetail_productId_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
	foreignKey({
			columns: [table.baseUnitId],
			foreignColumns: [productUnit.id],
			name: "StockDetail_baseUnitId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
	foreignKey({
			columns: [table.stockCategoryId],
			foreignColumns: [stockCategory.id],
			name: "StockDetail_stockCategoryId_fkey"
		}).onUpdate("cascade").onDelete("set null"),
	foreignKey({
			columns: [table.defaultLocationId],
			foreignColumns: [location.id],
			name: "StockDetail_defaultLocationId_fkey"
		}).onUpdate("cascade").onDelete("set null"),
	foreignKey({
			columns: [table.taxRateId],
			foreignColumns: [taxRate.id],
			name: "StockDetail_taxRateId_fkey"
		}).onUpdate("cascade").onDelete("set null"),
	foreignKey({
			columns: [table.openingGlId],
			foreignColumns: [generalLedger.id],
			name: "StockDetail_openingGLId_fkey"
		}).onUpdate("cascade").onDelete("set null"),
	foreignKey({
			columns: [table.salesGlId],
			foreignColumns: [generalLedger.id],
			name: "StockDetail_salesGLId_fkey"
		}).onUpdate("cascade").onDelete("set null"),
	foreignKey({
			columns: [table.salesReturnGlId],
			foreignColumns: [generalLedger.id],
			name: "StockDetail_salesReturnGLId_fkey"
		}).onUpdate("cascade").onDelete("set null"),
	foreignKey({
			columns: [table.defaultVendorId],
			foreignColumns: [party.id],
			name: "StockDetail_defaultVendorId_fkey"
		}).onUpdate("cascade").onDelete("set null"),
	unique("StockDetail_productId_key").on(table.productId),
	check("StockDetail_purchaseRate_check", sql`("purchaseRate" IS NULL) OR ("purchaseRate" >= (0)::numeric)`),
	check("StockDetail_salesRate_check", sql`("salesRate" IS NULL) OR ("salesRate" >= (0)::numeric)`),
	check("StockDetail_mrp_check", sql`(mrp IS NULL) OR (mrp >= (0)::numeric)`),
	check("StockDetail_tradePrice_check", sql`("tradePrice" IS NULL) OR ("tradePrice" >= (0)::numeric)`),
	check("StockDetail_minStock_check", sql`("minStock" IS NULL) OR ("minStock" >= (0)::numeric)`),
	check("StockDetail_maxStock_check", sql`("maxStock" IS NULL) OR ("maxStock" >= (0)::numeric)`),
	check("StockDetail_reorderLevel_check", sql`("reorderLevel" IS NULL) OR ("reorderLevel" >= (0)::numeric)`),
	check("StockDetail_reorderQty_check", sql`("reorderQty" IS NULL) OR ("reorderQty" >= (0)::numeric)`),
	check("StockDetail_min_le_max_stock_check", sql`("minStock" IS NULL) OR ("maxStock" IS NULL) OR ("minStock" <= "maxStock")`),
	check("StockDetail_reorder_le_max_stock_check", sql`("reorderLevel" IS NULL) OR ("maxStock" IS NULL) OR ("reorderLevel" <= "maxStock")`),
]);

export const serviceDetail = pgTable("ServiceDetail", {
	id: serial().primaryKey().notNull(),
	productId: integer().notNull(),
	unitId: integer(),
	taxRateId: integer(),
	salesGlId: integer("salesGLId").notNull(),
	purchaseGlId: integer("purchaseGLId").notNull(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
}, (table): PgTableExtraConfigValue[] => [
	index("ServiceDetail_purchaseGLId_idx").using("btree", table.purchaseGlId.asc().nullsLast().op("int4_ops")),
	index("ServiceDetail_salesGLId_idx").using("btree", table.salesGlId.asc().nullsLast().op("int4_ops")),
	index("ServiceDetail_taxRateId_idx").using("btree", table.taxRateId.asc().nullsLast().op("int4_ops")),
	index("ServiceDetail_unitId_idx").using("btree", table.unitId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [product.id],
			name: "ServiceDetail_productId_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
	foreignKey({
			columns: [table.unitId],
			foreignColumns: [productUnit.id],
			name: "ServiceDetail_unitId_fkey"
		}).onUpdate("cascade").onDelete("set null"),
	foreignKey({
			columns: [table.taxRateId],
			foreignColumns: [taxRate.id],
			name: "ServiceDetail_taxRateId_fkey"
		}).onUpdate("cascade").onDelete("set null"),
	foreignKey({
			columns: [table.salesGlId],
			foreignColumns: [generalLedger.id],
			name: "ServiceDetail_salesGLId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
	foreignKey({
			columns: [table.purchaseGlId],
			foreignColumns: [generalLedger.id],
			name: "ServiceDetail_purchaseGLId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
	unique("ServiceDetail_productId_key").on(table.productId),
]);

export const alternateUnit = pgTable("AlternateUnit", {
	id: serial().primaryKey().notNull(),
	stockDetailId: integer().notNull(),
	unitId: integer().notNull(),
	conversionFactor: numeric({ precision: 18, scale:  6 }).notNull(),
}, (table): PgTableExtraConfigValue[] => [
	index("AlternateUnit_unitId_idx").using("btree", table.unitId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.stockDetailId],
			foreignColumns: [stockDetail.id],
			name: "AlternateUnit_stockDetailId_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
	foreignKey({
			columns: [table.unitId],
			foreignColumns: [productUnit.id],
			name: "AlternateUnit_unitId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
	unique("AlternateUnit_stockDetailId_unitId_key").on(table.stockDetailId, table.unitId),
	check("AlternateUnit_conversionFactor_check", sql`"conversionFactor" > (0)::numeric`),
]);

export const nonStockDetail = pgTable("NonStockDetail", {
	id: serial().primaryKey().notNull(),
	productId: integer().notNull(),
	unitId: integer().notNull(),
	taxRateId: integer(),
	salesGlId: integer("salesGLId").notNull(),
	purchaseGlId: integer("purchaseGLId").notNull(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
}, (table): PgTableExtraConfigValue[] => [
	index("NonStockDetail_purchaseGLId_idx").using("btree", table.purchaseGlId.asc().nullsLast().op("int4_ops")),
	index("NonStockDetail_salesGLId_idx").using("btree", table.salesGlId.asc().nullsLast().op("int4_ops")),
	index("NonStockDetail_taxRateId_idx").using("btree", table.taxRateId.asc().nullsLast().op("int4_ops")),
	index("NonStockDetail_unitId_idx").using("btree", table.unitId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [product.id],
			name: "NonStockDetail_productId_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
	foreignKey({
			columns: [table.unitId],
			foreignColumns: [productUnit.id],
			name: "NonStockDetail_unitId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
	foreignKey({
			columns: [table.taxRateId],
			foreignColumns: [taxRate.id],
			name: "NonStockDetail_taxRateId_fkey"
		}).onUpdate("cascade").onDelete("set null"),
	foreignKey({
			columns: [table.salesGlId],
			foreignColumns: [generalLedger.id],
			name: "NonStockDetail_salesGLId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
	foreignKey({
			columns: [table.purchaseGlId],
			foreignColumns: [generalLedger.id],
			name: "NonStockDetail_purchaseGLId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
	unique("NonStockDetail_productId_key").on(table.productId),
]);

export const taxRate = pgTable("TaxRate", {
	id: serial().primaryKey().notNull(),
	code: varchar({ length: 10 }).notNull(),
	name: varchar({ length: 50 }).notNull(),
	ratePercent: numeric({ precision: 5, scale:  2 }).notNull(),
	hsnSacCode: varchar({ length: 20 }),
	isActive: boolean().default(true).notNull(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
	companyId: integer().notNull(),
}, (table): PgTableExtraConfigValue[] => [
	index("TaxRate_companyId_idx").using("btree", table.companyId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.companyId],
			foreignColumns: [company.id],
			name: "TaxRate_companyId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
	unique("TaxRate_companyId_code_key").on(table.code, table.companyId),
	check("TaxRate_ratePercent_check", sql`("ratePercent" >= (0)::numeric) AND ("ratePercent" <= (100)::numeric)`),
]);

export const stockCategory = pgTable("StockCategory", {
	id: serial().primaryKey().notNull(),
	code: varchar({ length: 10 }).notNull(),
	name: varchar({ length: 50 }).notNull(),
	isActive: boolean().default(true).notNull(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
	companyId: integer().notNull(),
}, (table): PgTableExtraConfigValue[] => [
	index("StockCategory_companyId_idx").using("btree", table.companyId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.companyId],
			foreignColumns: [company.id],
			name: "StockCategory_companyId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
	unique("StockCategory_companyId_code_key").on(table.code, table.companyId),
	unique("StockCategory_companyId_name_key").on(table.name, table.companyId),
]);

export const fixedAssetDetail = pgTable("FixedAssetDetail", {
	id: serial().primaryKey().notNull(),
	productId: integer().notNull(),
	assetGlId: integer("assetGLId").notNull(),
	accumulatedDeprGlId: integer("accumulatedDeprGLId").notNull(),
	depreciationExpenseGlId: integer("depreciationExpenseGLId").notNull(),
	locationId: integer(),
	purchaseDate: date(),
	originalCost: numeric({ precision: 18, scale:  6 }),
	salvageValue: numeric({ precision: 18, scale:  6 }).default('0').notNull(),
	usefulLifeYears: integer(),
	depreciationMethod: depreciationMethod().default('STRAIGHT_LINE').notNull(),
	depreciationRatePercent: numeric({ precision: 5, scale:  2 }),
	accumulatedDepreciation: numeric({ precision: 18, scale:  6 }).default('0').notNull(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
}, (table): PgTableExtraConfigValue[] => [
	index("FixedAssetDetail_accumulatedDeprGLId_idx").using("btree", table.accumulatedDeprGlId.asc().nullsLast().op("int4_ops")),
	index("FixedAssetDetail_assetGLId_idx").using("btree", table.assetGlId.asc().nullsLast().op("int4_ops")),
	index("FixedAssetDetail_depreciationExpenseGLId_idx").using("btree", table.depreciationExpenseGlId.asc().nullsLast().op("int4_ops")),
	index("FixedAssetDetail_locationId_idx").using("btree", table.locationId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [product.id],
			name: "FixedAssetDetail_productId_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
	foreignKey({
			columns: [table.assetGlId],
			foreignColumns: [generalLedger.id],
			name: "FixedAssetDetail_assetGLId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
	foreignKey({
			columns: [table.accumulatedDeprGlId],
			foreignColumns: [generalLedger.id],
			name: "FixedAssetDetail_accumulatedDeprGLId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
	foreignKey({
			columns: [table.depreciationExpenseGlId],
			foreignColumns: [generalLedger.id],
			name: "FixedAssetDetail_depreciationExpenseGLId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
	foreignKey({
			columns: [table.locationId],
			foreignColumns: [location.id],
			name: "FixedAssetDetail_locationId_fkey"
		}).onUpdate("cascade").onDelete("set null"),
	unique("FixedAssetDetail_productId_key").on(table.productId),
	check("FixedAssetDetail_originalCost_check", sql`("originalCost" IS NULL) OR ("originalCost" >= (0)::numeric)`),
	check("FixedAssetDetail_salvageValue_check", sql`"salvageValue" >= (0)::numeric`),
	check("FixedAssetDetail_salvage_le_cost_check", sql`("originalCost" IS NULL) OR ("salvageValue" <= "originalCost")`),
	check("FixedAssetDetail_usefulLifeYears_check", sql`("usefulLifeYears" IS NULL) OR ("usefulLifeYears" > 0)`),
	check("FixedAssetDetail_depreciationRatePercent_check", sql`("depreciationRatePercent" IS NULL) OR (("depreciationRatePercent" >= (0)::numeric) AND ("depreciationRatePercent" <= (100)::numeric))`),
	check("FixedAssetDetail_accumulatedDepreciation_check", sql`"accumulatedDepreciation" >= (0)::numeric`),
]);

export const bundleDetail = pgTable("BundleDetail", {
	id: serial().primaryKey().notNull(),
	productId: integer().notNull(),
	salesGlId: integer("salesGLId").notNull(),
	bundlePrice: numeric({ precision: 18, scale:  6 }),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
}, (table): PgTableExtraConfigValue[] => [
	index("BundleDetail_salesGLId_idx").using("btree", table.salesGlId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [product.id],
			name: "BundleDetail_productId_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
	foreignKey({
			columns: [table.salesGlId],
			foreignColumns: [generalLedger.id],
			name: "BundleDetail_salesGLId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
	unique("BundleDetail_productId_key").on(table.productId),
	check("BundleDetail_bundlePrice_check", sql`("bundlePrice" IS NULL) OR ("bundlePrice" >= (0)::numeric)`),
]);

export const bundleComponent = pgTable("BundleComponent", {
	id: serial().primaryKey().notNull(),
	bundleDetailId: integer().notNull(),
	componentProductId: integer().notNull(),
	quantity: numeric({ precision: 18, scale:  6 }).notNull(),
}, (table): PgTableExtraConfigValue[] => [
	index("BundleComponent_componentProductId_idx").using("btree", table.componentProductId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.bundleDetailId],
			foreignColumns: [bundleDetail.id],
			name: "BundleComponent_bundleDetailId_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
	foreignKey({
			columns: [table.componentProductId],
			foreignColumns: [product.id],
			name: "BundleComponent_componentProductId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
	unique("BundleComponent_bundleDetailId_componentProductId_key").on(table.bundleDetailId, table.componentProductId),
	check("BundleComponent_quantity_check", sql`quantity > (0)::numeric`),
]);

export const fiscalYear = pgTable("FiscalYear", {
	id: serial().primaryKey().notNull(),
	code: varchar({ length: 15 }).notNull(),
	startDate: date().notNull(),
	endDate: date().notNull(),
	isCurrent: boolean().default(false).notNull(),
	isClosed: boolean().default(false).notNull(),
	closedAt: timestamp({ precision: 3, mode: 'string' }),
	closedBy: integer(),
	isActive: boolean().default(true).notNull(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
	isOpeningBalanceLocked: boolean().default(false).notNull(),
	openingBalanceLockedAt: timestamp({ precision: 3, mode: 'string' }),
	openingBalanceLockedBy: integer(),
	companyId: integer().notNull(),
}, (table): PgTableExtraConfigValue[] => [
	index("FiscalYear_companyId_idx").using("btree", table.companyId.asc().nullsLast().op("int4_ops")),
	index("FiscalYear_companyId_isCurrent_idx").using("btree", table.companyId.asc().nullsLast().op("bool_ops"), table.isCurrent.asc().nullsLast().op("bool_ops")),
	index("FiscalYear_isClosed_idx").using("btree", table.isClosed.asc().nullsLast().op("bool_ops")),
	uniqueIndex("FiscalYear_only_one_current_per_company").using("btree", table.companyId.asc().nullsLast().op("int4_ops")).where(sql`("isCurrent" = true)`),
	foreignKey({
			columns: [table.closedBy],
			foreignColumns: [user.id],
			name: "FiscalYear_closedBy_fkey"
		}).onUpdate("cascade").onDelete("set null"),
	foreignKey({
			columns: [table.openingBalanceLockedBy],
			foreignColumns: [user.id],
			name: "FiscalYear_openingBalanceLockedBy_fkey"
		}).onUpdate("cascade").onDelete("set null"),
	foreignKey({
			columns: [table.companyId],
			foreignColumns: [company.id],
			name: "FiscalYear_companyId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
	unique("FiscalYear_companyId_code_key").on(table.code, table.companyId),
	check("FiscalYear_dateRange_check", sql`"endDate" > "startDate"`),
	check("FiscalYear_closedNotCurrent_check", sql`NOT (("isCurrent" = true) AND ("isClosed" = true))`),
]);

export const stockOpeningBalance = pgTable("StockOpeningBalance", {
	id: serial().primaryKey().notNull(),
	fiscalYearId: integer().notNull(),
	stockDetailId: integer().notNull(),
	locationId: integer(),
	batchNo: varchar({ length: 50 }),
	expiryDate: date(),
	quantity: numeric({ precision: 18, scale:  6 }).notNull(),
	rate: numeric({ precision: 18, scale:  6 }).notNull(),
	value: numeric({ precision: 18, scale:  6 }).notNull(),
	carriedForwardFromId: integer(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
	branchId: integer().notNull(),
}, (table): PgTableExtraConfigValue[] => [
	index("StockOpeningBalance_branchId_idx").using("btree", table.branchId.asc().nullsLast().op("int4_ops")),
	index("StockOpeningBalance_fiscalYearId_branchId_stockDetailId_idx").using("btree", table.fiscalYearId.asc().nullsLast().op("int4_ops"), table.branchId.asc().nullsLast().op("int4_ops"), table.stockDetailId.asc().nullsLast().op("int4_ops")),
	index("StockOpeningBalance_stockDetailId_idx").using("btree", table.stockDetailId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.fiscalYearId],
			foreignColumns: [fiscalYear.id],
			name: "StockOpeningBalance_fiscalYearId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
	foreignKey({
			columns: [table.stockDetailId],
			foreignColumns: [stockDetail.id],
			name: "StockOpeningBalance_stockDetailId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
	foreignKey({
			columns: [table.locationId],
			foreignColumns: [location.id],
			name: "StockOpeningBalance_locationId_fkey"
		}).onUpdate("cascade").onDelete("set null"),
	foreignKey({
			columns: [table.carriedForwardFromId],
			foreignColumns: [table.id],
			name: "StockOpeningBalance_carriedForwardFromId_fkey"
		}).onUpdate("cascade").onDelete("set null"),
	foreignKey({
			columns: [table.branchId],
			foreignColumns: [branch.id],
			name: "StockOpeningBalance_branchId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
	check("StockOpeningBalance_quantity_nonneg_check", sql`quantity >= (0)::numeric`),
	check("StockOpeningBalance_rate_nonneg_check", sql`rate >= (0)::numeric`),
	check("StockOpeningBalance_value_nonneg_check", sql`value >= (0)::numeric`),
]);

export const openingBalance = pgTable("OpeningBalance", {
	id: serial().primaryKey().notNull(),
	fiscalYearId: integer().notNull(),
	generalLedgerId: integer().notNull(),
	subLedgerId: integer(),
	debit: numeric({ precision: 18, scale:  6 }).default('0').notNull(),
	credit: numeric({ precision: 18, scale:  6 }).default('0').notNull(),
	remarks: varchar({ length: 500 }),
	carriedForwardFromId: integer(),
	createdBy: integer(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
	companyId: integer().notNull(),
	branchId: integer().notNull(),
}, (table): PgTableExtraConfigValue[] => [
	index("OpeningBalance_branchId_idx").using("btree", table.branchId.asc().nullsLast().op("int4_ops")),
	index("OpeningBalance_companyId_idx").using("btree", table.companyId.asc().nullsLast().op("int4_ops")),
	index("OpeningBalance_fiscalYearId_branchId_generalLedgerId_subLed_idx").using("btree", table.fiscalYearId.asc().nullsLast().op("int4_ops"), table.branchId.asc().nullsLast().op("int4_ops"), table.generalLedgerId.asc().nullsLast().op("int4_ops"), table.subLedgerId.asc().nullsLast().op("int4_ops")),
	uniqueIndex("OpeningBalance_fy_branch_gl_nosubledger_key").using("btree", table.fiscalYearId.asc().nullsLast().op("int4_ops"), table.branchId.asc().nullsLast().op("int4_ops"), table.generalLedgerId.asc().nullsLast().op("int4_ops")).where(sql`("subLedgerId" IS NULL)`),
	uniqueIndex("OpeningBalance_fy_branch_gl_subledger_key").using("btree", table.fiscalYearId.asc().nullsLast().op("int4_ops"), table.branchId.asc().nullsLast().op("int4_ops"), table.generalLedgerId.asc().nullsLast().op("int4_ops"), table.subLedgerId.asc().nullsLast().op("int4_ops")).where(sql`("subLedgerId" IS NOT NULL)`),
	index("OpeningBalance_generalLedgerId_idx").using("btree", table.generalLedgerId.asc().nullsLast().op("int4_ops")),
	index("OpeningBalance_subLedgerId_idx").using("btree", table.subLedgerId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.fiscalYearId],
			foreignColumns: [fiscalYear.id],
			name: "OpeningBalance_fiscalYearId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
	foreignKey({
			columns: [table.generalLedgerId],
			foreignColumns: [generalLedger.id],
			name: "OpeningBalance_generalLedgerId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
	foreignKey({
			columns: [table.subLedgerId],
			foreignColumns: [subLedger.id],
			name: "OpeningBalance_subLedgerId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
	foreignKey({
			columns: [table.carriedForwardFromId],
			foreignColumns: [table.id],
			name: "OpeningBalance_carriedForwardFromId_fkey"
		}).onUpdate("cascade").onDelete("set null"),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [user.id],
			name: "OpeningBalance_createdBy_fkey"
		}).onUpdate("cascade").onDelete("set null"),
	foreignKey({
			columns: [table.companyId],
			foreignColumns: [company.id],
			name: "OpeningBalance_companyId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
	foreignKey({
			columns: [table.branchId],
			foreignColumns: [branch.id],
			name: "OpeningBalance_branchId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
	check("OpeningBalance_debit_nonneg_check", sql`debit >= (0)::numeric`),
	check("OpeningBalance_credit_nonneg_check", sql`credit >= (0)::numeric`),
	check("OpeningBalance_debit_credit_not_both_check", sql`NOT ((debit > (0)::numeric) AND (credit > (0)::numeric))`),
]);

export const party = pgTable("Party", {
	id: serial().primaryKey().notNull(),
	generalLedgerId: integer().notNull(),
	address: varchar({ length: 255 }),
	city: varchar({ length: 50 }),
	state: varchar({ length: 50 }),
	country: varchar({ length: 50 }),
	phone: varchar({ length: 25 }),
	mobile: varchar({ length: 15 }),
	email: varchar({ length: 255 }),
	contactPerson: varchar({ length: 50 }),
	panNo: varchar({ length: 25 }),
	isVatRegistered: boolean().default(false).notNull(),
	bankReconcileDate: timestamp({ precision: 3, mode: 'string' }),
	subAreaId: integer(),
	agentId: integer(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
	companyId: integer().notNull(),
}, (table): PgTableExtraConfigValue[] => [
	index("Party_agentId_idx").using("btree", table.agentId.asc().nullsLast().op("int4_ops")),
	index("Party_companyId_idx").using("btree", table.companyId.asc().nullsLast().op("int4_ops")),
	index("Party_panNo_idx").using("btree", table.panNo.asc().nullsLast().op("text_ops")),
	index("Party_subAreaId_idx").using("btree", table.subAreaId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.generalLedgerId],
			foreignColumns: [generalLedger.id],
			name: "Party_generalLedgerId_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
	foreignKey({
			columns: [table.subAreaId],
			foreignColumns: [subArea.id],
			name: "Party_subAreaId_fkey"
		}).onUpdate("cascade").onDelete("set null"),
	foreignKey({
			columns: [table.agentId],
			foreignColumns: [agent.id],
			name: "Party_agentId_fkey"
		}).onUpdate("cascade").onDelete("set null"),
	foreignKey({
			columns: [table.companyId],
			foreignColumns: [company.id],
			name: "Party_companyId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
	unique("Party_generalLedgerId_key").on(table.generalLedgerId),
	unique("Party_companyId_panNo_key").on(table.panNo, table.companyId),
]);

export const company = pgTable("Company", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 200 }).notNull(),
	address: varchar({ length: 300 }),
	phone: varchar({ length: 20 }),
	email: varchar({ length: 255 }),
	logoUrl: varchar({ length: 500 }),
	baseCurrency: varchar({ length: 3 }).default('NPR').notNull(),
	retainedEarningsGlId: integer("retainedEarningsGLId"),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
	code: varchar({ length: 15 }).notNull(),
	legalName: varchar({ length: 200 }),
	businessType: businessType().default('OTHER').notNull(),
	registrationNo: varchar({ length: 50 }),
	panNo: varchar({ length: 25 }),
	vatNo: varchar({ length: 25 }),
	isVatRegistered: boolean().default(false).notNull(),
	taxOfficeName: varchar({ length: 100 }),
	city: varchar({ length: 50 }),
	district: varchar({ length: 50 }),
	province: varchar({ length: 50 }),
	country: varchar({ length: 50 }).default('Nepal'),
	website: varchar({ length: 255 }),
	defaultCalendarPref: calendarPreference().default('BS').notNull(),
	isActive: boolean().default(true).notNull(),
}, (table): PgTableExtraConfigValue[] => [
	index("Company_isActive_idx").using("btree", table.isActive.asc().nullsLast().op("bool_ops")),
	foreignKey({
			columns: [table.retainedEarningsGlId],
			foreignColumns: [generalLedger.id],
			name: "Company_retainedEarningsGLId_fkey"
		}).onUpdate("cascade").onDelete("set null"),
	unique("Company_retainedEarningsGLId_key").on(table.retainedEarningsGlId),
	unique("Company_code_key").on(table.code),
]);

export const branch = pgTable("Branch", {
	id: serial().primaryKey().notNull(),
	companyId: integer().notNull(),
	code: varchar({ length: 15 }).notNull(),
	name: varchar({ length: 100 }).notNull(),
	isHeadOffice: boolean().default(false).notNull(),
	address: varchar({ length: 300 }),
	phone: varchar({ length: 20 }),
	email: varchar({ length: 255 }),
	isActive: boolean().default(true).notNull(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
}, (table): PgTableExtraConfigValue[] => [
	index("Branch_companyId_idx").using("btree", table.companyId.asc().nullsLast().op("int4_ops")),
	uniqueIndex("Branch_only_one_head_office_per_company").using("btree", table.companyId.asc().nullsLast().op("int4_ops")).where(sql`("isHeadOffice" = true)`),
	foreignKey({
			columns: [table.companyId],
			foreignColumns: [company.id],
			name: "Branch_companyId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
	unique("Branch_companyId_code_key").on(table.companyId, table.code),
	unique("Branch_companyId_name_key").on(table.companyId, table.name),
]);

export const userCompanyAccess = pgTable("UserCompanyAccess", {
	id: serial().primaryKey().notNull(),
	userId: integer().notNull(),
	companyId: integer().notNull(),
	branchId: integer(),
	role: companyRole().default('VIEWER').notNull(),
	isActive: boolean().default(true).notNull(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table): PgTableExtraConfigValue[] => [
	index("UserCompanyAccess_branchId_idx").using("btree", table.branchId.asc().nullsLast().op("int4_ops")),
	index("UserCompanyAccess_companyId_idx").using("btree", table.companyId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "UserCompanyAccess_userId_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
	foreignKey({
			columns: [table.companyId],
			foreignColumns: [company.id],
			name: "UserCompanyAccess_companyId_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
	foreignKey({
			columns: [table.branchId],
			foreignColumns: [branch.id],
			name: "UserCompanyAccess_branchId_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
	unique("UserCompanyAccess_userId_companyId_branchId_key").on(table.userId, table.companyId, table.branchId),
]);

export const productGroup = pgTable("ProductGroup", {
	id: serial().primaryKey().notNull(),
	code: varchar({ length: 10 }).notNull(),
	name: varchar({ length: 50 }).notNull(),
	isActive: boolean().default(true).notNull(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
	companyId: integer().notNull(),
}, (table): PgTableExtraConfigValue[] => [
	index("ProductGroup_companyId_idx").using("btree", table.companyId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.companyId],
			foreignColumns: [company.id],
			name: "ProductGroup_companyId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
	unique("ProductGroup_companyId_code_key").on(table.code, table.companyId),
	unique("ProductGroup_companyId_name_key").on(table.name, table.companyId),
]);
export const vwLedgerTransactions = pgView("vw_ledger_transactions", {	source: text(),
	voucherId: integer(),
	voucherNumber: varchar({ length: 30 }),
	voucherDate: date(),
	generalLedgerId: integer(),
	debit: numeric({ precision: 18, scale:  6 }),
	credit: numeric({ precision: 18, scale:  6 }),
	narration: varchar({ length: 500 }),
}).as(sql`SELECT 'JOURNAL'::text AS source, jv.id AS "voucherId", jv."voucherNumber", jv."voucherDate", jvl."generalLedgerId", jvl.debit, jvl.credit, jvl.narration FROM "JournalVoucherLine" jvl JOIN "JournalVoucher" jv ON jv.id = jvl."journalVoucherId" WHERE jv."isPosted" = true UNION ALL SELECT 'CASH_BANK'::text AS source, cbv.id AS "voucherId", cbv."voucherNumber", cbv."voucherDate", cbl."generalLedgerId", cbl.debit, cbl.credit, cbl.narration FROM "CashBankVoucherLine" cbl JOIN "CashBankVoucher" cbv ON cbv.id = cbl."cashBankVoucherId" WHERE cbv."isPosted" = true`);
// NOTE: "StockOpeningBalance_unique_row" — a UNIQUE index over
// ("fiscalYearId","branchId","stockDetailId", COALESCE("locationId",0), COALESCE("batchNo",''))
// — exists in the database (see drizzle/0000_baseline.sql) but is not declared here:
// drizzle-kit cannot introspect expression indexes. It is hand-maintained SQL.
