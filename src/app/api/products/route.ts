import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma, type ProductType } from "@prisma/client";

export const dynamic = "force-dynamic";

// Minimal shape for dropdowns elsewhere (e.g. the Bundle Components picker
// on this same form, and any future voucher/invoice line that needs "pick a
// product"). The full Product Master list page queries prisma directly in
// the page component, same convention as Parties/Ledgers.
export async function GET() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: { code: "asc" },
    select: { id: true, code: true, description: true, type: true },
  });
  return NextResponse.json(products);
}

const PRODUCT_TYPES: ProductType[] = ["STOCK", "NON_STOCK", "SERVICE", "FIXED_ASSET", "BUNDLE"];

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    code,
    description,
    shortName,
    barcode,
    type,
    productSubGroupId,
    isActive,
    // STOCK
    baseUnitId,
    stockCategoryId,
    defaultLocationId,
    taxRateId,
    valuationMethod,
    tracksBatch,
    tracksExpiry,
    purchaseRate,
    salesRate,
    mrp,
    tradePrice,
    minStock,
    maxStock,
    reorderLevel,
    reorderQty,
    openingGLId,
    closingPLGLId,
    closingBSGLId,
    purchaseGLId,
    purchaseReturnGLId,
    salesGLId,
    salesReturnGLId,
    defaultVendorId,
    alternateUnits,
    // NON_STOCK / SERVICE
    unitId,
    nsSalesGLId,
    nsPurchaseGLId,
    svUnitId,
    svSalesGLId,
    svPurchaseGLId,
    // FIXED_ASSET
    assetGLId,
    accumulatedDeprGLId,
    depreciationExpenseGLId,
    locationId,
    purchaseDate,
    originalCost,
    salvageValue,
    usefulLifeYears,
    depreciationMethod,
    depreciationRatePercent,
    // BUNDLE
    bundleSalesGLId,
    bundlePrice,
    components,
  } = body ?? {};

  if (!code || !description || !type || !productSubGroupId) {
    return NextResponse.json(
      { error: "Code, Description, Product Type, and Product Sub-Group are required." },
      { status: 400 }
    );
  }
  if (!PRODUCT_TYPES.includes(type)) {
    return NextResponse.json({ error: "Invalid product type." }, { status: 400 });
  }

  // Type-specific required-field validation, mirroring the schema's
  // required (non-nullable) FKs for each detail table.
  if (type === "STOCK" && !baseUnitId) {
    return NextResponse.json({ error: "Base Unit is required for a Stock product." }, { status: 400 });
  }
  if (type === "NON_STOCK" && (!unitId || !nsSalesGLId || !nsPurchaseGLId)) {
    return NextResponse.json(
      { error: "Unit, Sales GL, and Purchase GL are required for a Non-Stock product." },
      { status: 400 }
    );
  }
  if (type === "SERVICE" && (!svSalesGLId || !svPurchaseGLId)) {
    return NextResponse.json(
      { error: "Sales GL and Purchase GL are required for a Service product." },
      { status: 400 }
    );
  }
  if (type === "FIXED_ASSET" && (!assetGLId || !accumulatedDeprGLId || !depreciationExpenseGLId)) {
    return NextResponse.json(
      { error: "Asset GL, Accumulated Depreciation GL, and Depreciation Expense GL are required for a Fixed Asset." },
      { status: 400 }
    );
  }
  if (type === "BUNDLE") {
    if (!bundleSalesGLId) {
      return NextResponse.json({ error: "Sales GL is required for a Bundle product." }, { status: 400 });
    }
    if (!Array.isArray(components) || components.length === 0) {
      return NextResponse.json({ error: "A Bundle needs at least one component." }, { status: 400 });
    }
  }

  try {
    const product = await prisma.$transaction(async (tx) => {
      const created = await tx.product.create({
        data: {
          code,
          description,
          shortName: shortName || null,
          barcode: barcode || null,
          type,
          productSubGroupId: Number(productSubGroupId),
          isActive: typeof isActive === "boolean" ? isActive : true,
        },
      });

      if (type === "STOCK") {
        await tx.stockDetail.create({
          data: {
            productId: created.id,
            baseUnitId: Number(baseUnitId),
            stockCategoryId: stockCategoryId ? Number(stockCategoryId) : null,
            defaultLocationId: defaultLocationId ? Number(defaultLocationId) : null,
            taxRateId: taxRateId ? Number(taxRateId) : null,
            valuationMethod: valuationMethod || "WEIGHTED_AVERAGE",
            tracksBatch: Boolean(tracksBatch),
            tracksExpiry: Boolean(tracksExpiry),
            purchaseRate: purchaseRate ? Number(purchaseRate) : null,
            salesRate: salesRate ? Number(salesRate) : null,
            mrp: mrp ? Number(mrp) : null,
            tradePrice: tradePrice ? Number(tradePrice) : null,
            minStock: minStock ? Number(minStock) : null,
            maxStock: maxStock ? Number(maxStock) : null,
            reorderLevel: reorderLevel ? Number(reorderLevel) : null,
            reorderQty: reorderQty ? Number(reorderQty) : null,
            openingGLId: openingGLId ? Number(openingGLId) : null,
            closingPLGLId: closingPLGLId ? Number(closingPLGLId) : null,
            closingBSGLId: closingBSGLId ? Number(closingBSGLId) : null,
            purchaseGLId: purchaseGLId ? Number(purchaseGLId) : null,
            purchaseReturnGLId: purchaseReturnGLId ? Number(purchaseReturnGLId) : null,
            salesGLId: salesGLId ? Number(salesGLId) : null,
            salesReturnGLId: salesReturnGLId ? Number(salesReturnGLId) : null,
            defaultVendorId: defaultVendorId ? Number(defaultVendorId) : null,
            alternateUnits: Array.isArray(alternateUnits)
              ? {
                  create: alternateUnits
                    .filter((au: { unitId?: string | number; conversionFactor?: string | number }) => au?.unitId)
                    .map((au: { unitId: string | number; conversionFactor: string | number }) => ({
                      unitId: Number(au.unitId),
                      conversionFactor: Number(au.conversionFactor),
                    })),
                }
              : undefined,
          },
        });
      } else if (type === "NON_STOCK") {
        await tx.nonStockDetail.create({
          data: {
            productId: created.id,
            unitId: Number(unitId),
            taxRateId: taxRateId ? Number(taxRateId) : null,
            salesGLId: Number(nsSalesGLId),
            purchaseGLId: Number(nsPurchaseGLId),
          },
        });
      } else if (type === "SERVICE") {
        await tx.serviceDetail.create({
          data: {
            productId: created.id,
            unitId: svUnitId ? Number(svUnitId) : null,
            taxRateId: taxRateId ? Number(taxRateId) : null,
            salesGLId: Number(svSalesGLId),
            purchaseGLId: Number(svPurchaseGLId),
          },
        });
      } else if (type === "FIXED_ASSET") {
        await tx.fixedAssetDetail.create({
          data: {
            productId: created.id,
            assetGLId: Number(assetGLId),
            accumulatedDeprGLId: Number(accumulatedDeprGLId),
            depreciationExpenseGLId: Number(depreciationExpenseGLId),
            locationId: locationId ? Number(locationId) : null,
            purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
            originalCost: originalCost ? Number(originalCost) : null,
            salvageValue: salvageValue ? Number(salvageValue) : 0,
            usefulLifeYears: usefulLifeYears ? Number(usefulLifeYears) : null,
            depreciationMethod: depreciationMethod || "STRAIGHT_LINE",
            depreciationRatePercent: depreciationRatePercent ? Number(depreciationRatePercent) : null,
          },
        });
      } else if (type === "BUNDLE") {
        await tx.bundleDetail.create({
          data: {
            productId: created.id,
            salesGLId: Number(bundleSalesGLId),
            bundlePrice: bundlePrice ? Number(bundlePrice) : null,
            components: {
              create: (components as { componentProductId: string | number; quantity: string | number }[]).map(
                (c) => ({
                  componentProductId: Number(c.componentProductId),
                  quantity: Number(c.quantity),
                })
              ),
            },
          },
        });
      }

      return created;
    });

    return NextResponse.json(product, { status: 201 });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json(
        { error: "A product with that code or barcode already exists." },
        { status: 409 }
      );
    }
    const message = err instanceof Error ? err.message : "Failed to create product.";
    console.error(err);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
