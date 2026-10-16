import { relations } from "drizzle-orm/relations";
import { accountSubGroup, generalLedger, subArea, agent, company, accountGroup, area, party, customerDetail, vendorDetail, user, auditLog, journalVoucher, branch, journalVoucherLine, cashBankVoucher, cashBankVoucherLine, productUnit, location, subLedger, productGroup, productSubGroup, product, stockDetail, stockCategory, taxRate, serviceDetail, alternateUnit, nonStockDetail, fixedAssetDetail, bundleDetail, bundleComponent, fiscalYear, stockOpeningBalance, openingBalance, userCompanyAccess } from "./schema";

export const generalLedgerRelations = relations(generalLedger, ({one, many}) => ({
	accountSubGroup: one(accountSubGroup, {
		fields: [generalLedger.accountSubGroupId],
		references: [accountSubGroup.id]
	}),
	generalLedger: one(generalLedger, {
		fields: [generalLedger.parentId],
		references: [generalLedger.id],
		relationName: "generalLedger_parentId_generalLedger_id"
	}),
	generalLedgers: many(generalLedger, {
		relationName: "generalLedger_parentId_generalLedger_id"
	}),
	subArea: one(subArea, {
		fields: [generalLedger.subAreaId],
		references: [subArea.id]
	}),
	agent: one(agent, {
		fields: [generalLedger.agentId],
		references: [agent.id]
	}),
	company: one(company, {
		fields: [generalLedger.companyId],
		references: [company.id],
		relationName: "generalLedger_companyId_company_id"
	}),
	journalVoucherLines: many(journalVoucherLine),
	cashBankVoucherLines: many(cashBankVoucherLine),
	subLedgers: many(subLedger),
	stockDetails_closingPlglId: many(stockDetail, {
		relationName: "stockDetail_closingPlglId_generalLedger_id"
	}),
	stockDetails_closingBsglId: many(stockDetail, {
		relationName: "stockDetail_closingBsglId_generalLedger_id"
	}),
	stockDetails_purchaseGlId: many(stockDetail, {
		relationName: "stockDetail_purchaseGlId_generalLedger_id"
	}),
	stockDetails_purchaseReturnGlId: many(stockDetail, {
		relationName: "stockDetail_purchaseReturnGlId_generalLedger_id"
	}),
	stockDetails_openingGlId: many(stockDetail, {
		relationName: "stockDetail_openingGlId_generalLedger_id"
	}),
	stockDetails_salesGlId: many(stockDetail, {
		relationName: "stockDetail_salesGlId_generalLedger_id"
	}),
	stockDetails_salesReturnGlId: many(stockDetail, {
		relationName: "stockDetail_salesReturnGlId_generalLedger_id"
	}),
	serviceDetails_salesGlId: many(serviceDetail, {
		relationName: "serviceDetail_salesGlId_generalLedger_id"
	}),
	serviceDetails_purchaseGlId: many(serviceDetail, {
		relationName: "serviceDetail_purchaseGlId_generalLedger_id"
	}),
	nonStockDetails_salesGlId: many(nonStockDetail, {
		relationName: "nonStockDetail_salesGlId_generalLedger_id"
	}),
	nonStockDetails_purchaseGlId: many(nonStockDetail, {
		relationName: "nonStockDetail_purchaseGlId_generalLedger_id"
	}),
	fixedAssetDetails_assetGlId: many(fixedAssetDetail, {
		relationName: "fixedAssetDetail_assetGlId_generalLedger_id"
	}),
	fixedAssetDetails_accumulatedDeprGlId: many(fixedAssetDetail, {
		relationName: "fixedAssetDetail_accumulatedDeprGlId_generalLedger_id"
	}),
	fixedAssetDetails_depreciationExpenseGlId: many(fixedAssetDetail, {
		relationName: "fixedAssetDetail_depreciationExpenseGlId_generalLedger_id"
	}),
	bundleDetails: many(bundleDetail),
	openingBalances: many(openingBalance),
	parties: many(party),
	companies: many(company, {
		relationName: "company_retainedEarningsGlId_generalLedger_id"
	}),
}));

export const accountSubGroupRelations = relations(accountSubGroup, ({one, many}) => ({
	generalLedgers: many(generalLedger),
	accountGroup: one(accountGroup, {
		fields: [accountSubGroup.accountGroupId],
		references: [accountGroup.id]
	}),
}));

export const subAreaRelations = relations(subArea, ({one, many}) => ({
	generalLedgers: many(generalLedger),
	area: one(area, {
		fields: [subArea.areaId],
		references: [area.id]
	}),
	parties: many(party),
}));

export const agentRelations = relations(agent, ({one, many}) => ({
	generalLedgers: many(generalLedger),
	company: one(company, {
		fields: [agent.companyId],
		references: [company.id]
	}),
	journalVoucherLines: many(journalVoucherLine),
	cashBankVoucherLines: many(cashBankVoucherLine),
	parties: many(party),
}));

export const companyRelations = relations(company, ({one, many}) => ({
	generalLedgers: many(generalLedger, {
		relationName: "generalLedger_companyId_company_id"
	}),
	agents: many(agent),
	accountGroups: many(accountGroup),
	areas: many(area),
	journalVouchers: many(journalVoucher),
	cashBankVouchers: many(cashBankVoucher),
	productUnits: many(productUnit),
	locations: many(location),
	products: many(product),
	taxRates: many(taxRate),
	stockCategories: many(stockCategory),
	fiscalYears: many(fiscalYear),
	openingBalances: many(openingBalance),
	parties: many(party),
	generalLedger: one(generalLedger, {
		fields: [company.retainedEarningsGlId],
		references: [generalLedger.id],
		relationName: "company_retainedEarningsGlId_generalLedger_id"
	}),
	branches: many(branch),
	userCompanyAccesses: many(userCompanyAccess),
	productGroups: many(productGroup),
}));

export const accountGroupRelations = relations(accountGroup, ({one, many}) => ({
	accountSubGroups: many(accountSubGroup),
	company: one(company, {
		fields: [accountGroup.companyId],
		references: [company.id]
	}),
}));

export const areaRelations = relations(area, ({one, many}) => ({
	subAreas: many(subArea),
	company: one(company, {
		fields: [area.companyId],
		references: [company.id]
	}),
}));

export const customerDetailRelations = relations(customerDetail, ({one}) => ({
	party: one(party, {
		fields: [customerDetail.partyId],
		references: [party.id]
	}),
}));

export const partyRelations = relations(party, ({one, many}) => ({
	customerDetails: many(customerDetail),
	vendorDetails: many(vendorDetail),
	subLedgers: many(subLedger),
	stockDetails: many(stockDetail),
	generalLedger: one(generalLedger, {
		fields: [party.generalLedgerId],
		references: [generalLedger.id]
	}),
	subArea: one(subArea, {
		fields: [party.subAreaId],
		references: [subArea.id]
	}),
	agent: one(agent, {
		fields: [party.agentId],
		references: [agent.id]
	}),
	company: one(company, {
		fields: [party.companyId],
		references: [company.id]
	}),
}));

export const vendorDetailRelations = relations(vendorDetail, ({one}) => ({
	party: one(party, {
		fields: [vendorDetail.partyId],
		references: [party.id]
	}),
}));

export const auditLogRelations = relations(auditLog, ({one}) => ({
	user: one(user, {
		fields: [auditLog.changedBy],
		references: [user.id]
	}),
}));

export const userRelations = relations(user, ({many}) => ({
	auditLogs: many(auditLog),
	journalVouchers_postedBy: many(journalVoucher, {
		relationName: "journalVoucher_postedBy_user_id"
	}),
	journalVouchers_createdBy: many(journalVoucher, {
		relationName: "journalVoucher_createdBy_user_id"
	}),
	cashBankVouchers_postedBy: many(cashBankVoucher, {
		relationName: "cashBankVoucher_postedBy_user_id"
	}),
	cashBankVouchers_createdBy: many(cashBankVoucher, {
		relationName: "cashBankVoucher_createdBy_user_id"
	}),
	cashBankVoucherLines: many(cashBankVoucherLine),
	fiscalYears_closedBy: many(fiscalYear, {
		relationName: "fiscalYear_closedBy_user_id"
	}),
	fiscalYears_openingBalanceLockedBy: many(fiscalYear, {
		relationName: "fiscalYear_openingBalanceLockedBy_user_id"
	}),
	openingBalances: many(openingBalance),
	userCompanyAccesses: many(userCompanyAccess),
}));

export const journalVoucherRelations = relations(journalVoucher, ({one, many}) => ({
	journalVoucher: one(journalVoucher, {
		fields: [journalVoucher.reversalOfId],
		references: [journalVoucher.id],
		relationName: "journalVoucher_reversalOfId_journalVoucher_id"
	}),
	journalVouchers: many(journalVoucher, {
		relationName: "journalVoucher_reversalOfId_journalVoucher_id"
	}),
	user_postedBy: one(user, {
		fields: [journalVoucher.postedBy],
		references: [user.id],
		relationName: "journalVoucher_postedBy_user_id"
	}),
	user_createdBy: one(user, {
		fields: [journalVoucher.createdBy],
		references: [user.id],
		relationName: "journalVoucher_createdBy_user_id"
	}),
	company: one(company, {
		fields: [journalVoucher.companyId],
		references: [company.id]
	}),
	branch: one(branch, {
		fields: [journalVoucher.branchId],
		references: [branch.id]
	}),
	journalVoucherLines: many(journalVoucherLine),
}));

export const branchRelations = relations(branch, ({one, many}) => ({
	journalVouchers: many(journalVoucher),
	cashBankVouchers: many(cashBankVoucher),
	stockOpeningBalances: many(stockOpeningBalance),
	openingBalances: many(openingBalance),
	company: one(company, {
		fields: [branch.companyId],
		references: [company.id]
	}),
	userCompanyAccesses: many(userCompanyAccess),
}));

export const journalVoucherLineRelations = relations(journalVoucherLine, ({one}) => ({
	journalVoucher: one(journalVoucher, {
		fields: [journalVoucherLine.journalVoucherId],
		references: [journalVoucher.id]
	}),
	generalLedger: one(generalLedger, {
		fields: [journalVoucherLine.generalLedgerId],
		references: [generalLedger.id]
	}),
	agent: one(agent, {
		fields: [journalVoucherLine.agentId],
		references: [agent.id]
	}),
}));

export const cashBankVoucherRelations = relations(cashBankVoucher, ({one, many}) => ({
	cashBankVoucher: one(cashBankVoucher, {
		fields: [cashBankVoucher.reversalOfId],
		references: [cashBankVoucher.id],
		relationName: "cashBankVoucher_reversalOfId_cashBankVoucher_id"
	}),
	cashBankVouchers: many(cashBankVoucher, {
		relationName: "cashBankVoucher_reversalOfId_cashBankVoucher_id"
	}),
	user_postedBy: one(user, {
		fields: [cashBankVoucher.postedBy],
		references: [user.id],
		relationName: "cashBankVoucher_postedBy_user_id"
	}),
	user_createdBy: one(user, {
		fields: [cashBankVoucher.createdBy],
		references: [user.id],
		relationName: "cashBankVoucher_createdBy_user_id"
	}),
	company: one(company, {
		fields: [cashBankVoucher.companyId],
		references: [company.id]
	}),
	branch: one(branch, {
		fields: [cashBankVoucher.branchId],
		references: [branch.id]
	}),
	cashBankVoucherLines: many(cashBankVoucherLine),
}));

export const cashBankVoucherLineRelations = relations(cashBankVoucherLine, ({one}) => ({
	cashBankVoucher: one(cashBankVoucher, {
		fields: [cashBankVoucherLine.cashBankVoucherId],
		references: [cashBankVoucher.id]
	}),
	generalLedger: one(generalLedger, {
		fields: [cashBankVoucherLine.generalLedgerId],
		references: [generalLedger.id]
	}),
	agent: one(agent, {
		fields: [cashBankVoucherLine.agentId],
		references: [agent.id]
	}),
	user: one(user, {
		fields: [cashBankVoucherLine.clearedBy],
		references: [user.id]
	}),
}));

export const productUnitRelations = relations(productUnit, ({one, many}) => ({
	company: one(company, {
		fields: [productUnit.companyId],
		references: [company.id]
	}),
	stockDetails: many(stockDetail),
	serviceDetails: many(serviceDetail),
	alternateUnits: many(alternateUnit),
	nonStockDetails: many(nonStockDetail),
}));

export const locationRelations = relations(location, ({one, many}) => ({
	location: one(location, {
		fields: [location.parentId],
		references: [location.id],
		relationName: "location_parentId_location_id"
	}),
	locations: many(location, {
		relationName: "location_parentId_location_id"
	}),
	company: one(company, {
		fields: [location.companyId],
		references: [company.id]
	}),
	stockDetails: many(stockDetail),
	fixedAssetDetails: many(fixedAssetDetail),
	stockOpeningBalances: many(stockOpeningBalance),
}));

export const subLedgerRelations = relations(subLedger, ({one, many}) => ({
	generalLedger: one(generalLedger, {
		fields: [subLedger.generalLedgerId],
		references: [generalLedger.id]
	}),
	party: one(party, {
		fields: [subLedger.partyId],
		references: [party.id]
	}),
	openingBalances: many(openingBalance),
}));

export const productSubGroupRelations = relations(productSubGroup, ({one, many}) => ({
	productGroup: one(productGroup, {
		fields: [productSubGroup.productGroupId],
		references: [productGroup.id]
	}),
	products: many(product),
}));

export const productGroupRelations = relations(productGroup, ({one, many}) => ({
	productSubGroups: many(productSubGroup),
	company: one(company, {
		fields: [productGroup.companyId],
		references: [company.id]
	}),
}));

export const productRelations = relations(product, ({one, many}) => ({
	productSubGroup: one(productSubGroup, {
		fields: [product.productSubGroupId],
		references: [productSubGroup.id]
	}),
	company: one(company, {
		fields: [product.companyId],
		references: [company.id]
	}),
	stockDetails: many(stockDetail),
	serviceDetails: many(serviceDetail),
	nonStockDetails: many(nonStockDetail),
	fixedAssetDetails: many(fixedAssetDetail),
	bundleDetails: many(bundleDetail),
	bundleComponents: many(bundleComponent),
}));

export const stockDetailRelations = relations(stockDetail, ({one, many}) => ({
	generalLedger_closingPlglId: one(generalLedger, {
		fields: [stockDetail.closingPlglId],
		references: [generalLedger.id],
		relationName: "stockDetail_closingPlglId_generalLedger_id"
	}),
	generalLedger_closingBsglId: one(generalLedger, {
		fields: [stockDetail.closingBsglId],
		references: [generalLedger.id],
		relationName: "stockDetail_closingBsglId_generalLedger_id"
	}),
	generalLedger_purchaseGlId: one(generalLedger, {
		fields: [stockDetail.purchaseGlId],
		references: [generalLedger.id],
		relationName: "stockDetail_purchaseGlId_generalLedger_id"
	}),
	generalLedger_purchaseReturnGlId: one(generalLedger, {
		fields: [stockDetail.purchaseReturnGlId],
		references: [generalLedger.id],
		relationName: "stockDetail_purchaseReturnGlId_generalLedger_id"
	}),
	product: one(product, {
		fields: [stockDetail.productId],
		references: [product.id]
	}),
	productUnit: one(productUnit, {
		fields: [stockDetail.baseUnitId],
		references: [productUnit.id]
	}),
	stockCategory: one(stockCategory, {
		fields: [stockDetail.stockCategoryId],
		references: [stockCategory.id]
	}),
	location: one(location, {
		fields: [stockDetail.defaultLocationId],
		references: [location.id]
	}),
	taxRate: one(taxRate, {
		fields: [stockDetail.taxRateId],
		references: [taxRate.id]
	}),
	generalLedger_openingGlId: one(generalLedger, {
		fields: [stockDetail.openingGlId],
		references: [generalLedger.id],
		relationName: "stockDetail_openingGlId_generalLedger_id"
	}),
	generalLedger_salesGlId: one(generalLedger, {
		fields: [stockDetail.salesGlId],
		references: [generalLedger.id],
		relationName: "stockDetail_salesGlId_generalLedger_id"
	}),
	generalLedger_salesReturnGlId: one(generalLedger, {
		fields: [stockDetail.salesReturnGlId],
		references: [generalLedger.id],
		relationName: "stockDetail_salesReturnGlId_generalLedger_id"
	}),
	party: one(party, {
		fields: [stockDetail.defaultVendorId],
		references: [party.id]
	}),
	alternateUnits: many(alternateUnit),
	stockOpeningBalances: many(stockOpeningBalance),
}));

export const stockCategoryRelations = relations(stockCategory, ({one, many}) => ({
	stockDetails: many(stockDetail),
	company: one(company, {
		fields: [stockCategory.companyId],
		references: [company.id]
	}),
}));

export const taxRateRelations = relations(taxRate, ({one, many}) => ({
	stockDetails: many(stockDetail),
	serviceDetails: many(serviceDetail),
	nonStockDetails: many(nonStockDetail),
	company: one(company, {
		fields: [taxRate.companyId],
		references: [company.id]
	}),
}));

export const serviceDetailRelations = relations(serviceDetail, ({one}) => ({
	product: one(product, {
		fields: [serviceDetail.productId],
		references: [product.id]
	}),
	productUnit: one(productUnit, {
		fields: [serviceDetail.unitId],
		references: [productUnit.id]
	}),
	taxRate: one(taxRate, {
		fields: [serviceDetail.taxRateId],
		references: [taxRate.id]
	}),
	generalLedger_salesGlId: one(generalLedger, {
		fields: [serviceDetail.salesGlId],
		references: [generalLedger.id],
		relationName: "serviceDetail_salesGlId_generalLedger_id"
	}),
	generalLedger_purchaseGlId: one(generalLedger, {
		fields: [serviceDetail.purchaseGlId],
		references: [generalLedger.id],
		relationName: "serviceDetail_purchaseGlId_generalLedger_id"
	}),
}));

export const alternateUnitRelations = relations(alternateUnit, ({one}) => ({
	stockDetail: one(stockDetail, {
		fields: [alternateUnit.stockDetailId],
		references: [stockDetail.id]
	}),
	productUnit: one(productUnit, {
		fields: [alternateUnit.unitId],
		references: [productUnit.id]
	}),
}));

export const nonStockDetailRelations = relations(nonStockDetail, ({one}) => ({
	product: one(product, {
		fields: [nonStockDetail.productId],
		references: [product.id]
	}),
	productUnit: one(productUnit, {
		fields: [nonStockDetail.unitId],
		references: [productUnit.id]
	}),
	taxRate: one(taxRate, {
		fields: [nonStockDetail.taxRateId],
		references: [taxRate.id]
	}),
	generalLedger_salesGlId: one(generalLedger, {
		fields: [nonStockDetail.salesGlId],
		references: [generalLedger.id],
		relationName: "nonStockDetail_salesGlId_generalLedger_id"
	}),
	generalLedger_purchaseGlId: one(generalLedger, {
		fields: [nonStockDetail.purchaseGlId],
		references: [generalLedger.id],
		relationName: "nonStockDetail_purchaseGlId_generalLedger_id"
	}),
}));

export const fixedAssetDetailRelations = relations(fixedAssetDetail, ({one}) => ({
	product: one(product, {
		fields: [fixedAssetDetail.productId],
		references: [product.id]
	}),
	generalLedger_assetGlId: one(generalLedger, {
		fields: [fixedAssetDetail.assetGlId],
		references: [generalLedger.id],
		relationName: "fixedAssetDetail_assetGlId_generalLedger_id"
	}),
	generalLedger_accumulatedDeprGlId: one(generalLedger, {
		fields: [fixedAssetDetail.accumulatedDeprGlId],
		references: [generalLedger.id],
		relationName: "fixedAssetDetail_accumulatedDeprGlId_generalLedger_id"
	}),
	generalLedger_depreciationExpenseGlId: one(generalLedger, {
		fields: [fixedAssetDetail.depreciationExpenseGlId],
		references: [generalLedger.id],
		relationName: "fixedAssetDetail_depreciationExpenseGlId_generalLedger_id"
	}),
	location: one(location, {
		fields: [fixedAssetDetail.locationId],
		references: [location.id]
	}),
}));

export const bundleDetailRelations = relations(bundleDetail, ({one, many}) => ({
	product: one(product, {
		fields: [bundleDetail.productId],
		references: [product.id]
	}),
	generalLedger: one(generalLedger, {
		fields: [bundleDetail.salesGlId],
		references: [generalLedger.id]
	}),
	bundleComponents: many(bundleComponent),
}));

export const bundleComponentRelations = relations(bundleComponent, ({one}) => ({
	bundleDetail: one(bundleDetail, {
		fields: [bundleComponent.bundleDetailId],
		references: [bundleDetail.id]
	}),
	product: one(product, {
		fields: [bundleComponent.componentProductId],
		references: [product.id]
	}),
}));

export const fiscalYearRelations = relations(fiscalYear, ({one, many}) => ({
	user_closedBy: one(user, {
		fields: [fiscalYear.closedBy],
		references: [user.id],
		relationName: "fiscalYear_closedBy_user_id"
	}),
	user_openingBalanceLockedBy: one(user, {
		fields: [fiscalYear.openingBalanceLockedBy],
		references: [user.id],
		relationName: "fiscalYear_openingBalanceLockedBy_user_id"
	}),
	company: one(company, {
		fields: [fiscalYear.companyId],
		references: [company.id]
	}),
	stockOpeningBalances: many(stockOpeningBalance),
	openingBalances: many(openingBalance),
}));

export const stockOpeningBalanceRelations = relations(stockOpeningBalance, ({one, many}) => ({
	fiscalYear: one(fiscalYear, {
		fields: [stockOpeningBalance.fiscalYearId],
		references: [fiscalYear.id]
	}),
	stockDetail: one(stockDetail, {
		fields: [stockOpeningBalance.stockDetailId],
		references: [stockDetail.id]
	}),
	location: one(location, {
		fields: [stockOpeningBalance.locationId],
		references: [location.id]
	}),
	stockOpeningBalance: one(stockOpeningBalance, {
		fields: [stockOpeningBalance.carriedForwardFromId],
		references: [stockOpeningBalance.id],
		relationName: "stockOpeningBalance_carriedForwardFromId_stockOpeningBalance_id"
	}),
	stockOpeningBalances: many(stockOpeningBalance, {
		relationName: "stockOpeningBalance_carriedForwardFromId_stockOpeningBalance_id"
	}),
	branch: one(branch, {
		fields: [stockOpeningBalance.branchId],
		references: [branch.id]
	}),
}));

export const openingBalanceRelations = relations(openingBalance, ({one, many}) => ({
	fiscalYear: one(fiscalYear, {
		fields: [openingBalance.fiscalYearId],
		references: [fiscalYear.id]
	}),
	generalLedger: one(generalLedger, {
		fields: [openingBalance.generalLedgerId],
		references: [generalLedger.id]
	}),
	subLedger: one(subLedger, {
		fields: [openingBalance.subLedgerId],
		references: [subLedger.id]
	}),
	openingBalance: one(openingBalance, {
		fields: [openingBalance.carriedForwardFromId],
		references: [openingBalance.id],
		relationName: "openingBalance_carriedForwardFromId_openingBalance_id"
	}),
	openingBalances: many(openingBalance, {
		relationName: "openingBalance_carriedForwardFromId_openingBalance_id"
	}),
	user: one(user, {
		fields: [openingBalance.createdBy],
		references: [user.id]
	}),
	company: one(company, {
		fields: [openingBalance.companyId],
		references: [company.id]
	}),
	branch: one(branch, {
		fields: [openingBalance.branchId],
		references: [branch.id]
	}),
}));

export const userCompanyAccessRelations = relations(userCompanyAccess, ({one}) => ({
	user: one(user, {
		fields: [userCompanyAccess.userId],
		references: [user.id]
	}),
	company: one(company, {
		fields: [userCompanyAccess.companyId],
		references: [company.id]
	}),
	branch: one(branch, {
		fields: [userCompanyAccess.branchId],
		references: [branch.id]
	}),
}));