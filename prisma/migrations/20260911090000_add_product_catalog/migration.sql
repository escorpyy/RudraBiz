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
