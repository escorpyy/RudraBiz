import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id: Number(id) },
    include: {
      productSubGroup: { include: { productGroup: true } },
      stockDetail: {
        include: {
          baseUnit: true,
          stockCategory: true,
          defaultLocation: true,
          taxRate: true,
          openingGL: true,
          closingPLGL: true,
          closingBSGL: true,
          purchaseGL: true,
          purchaseReturnGL: true,
          salesGL: true,
          salesReturnGL: true,
          defaultVendor: { include: { generalLedger: true } },
          alternateUnits: { include: { unit: true } },
        },
      },
      nonStockDetail: { include: { unit: true, taxRate: true, salesGL: true, purchaseGL: true } },
      serviceDetail: { include: { unit: true, taxRate: true, salesGL: true, purchaseGL: true } },
      fixedAssetDetail: {
        include: { assetGL: true, accumulatedDeprGL: true, depreciationExpenseGL: true, location: true },
      },
      bundleDetail: {
        include: {
          salesGL: true,
          components: { include: { componentProduct: true } },
        },
      },
    },
  });
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(product);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const productId = Number(id);
  const body = await req.json();
  const {
    code,
    description,
    shortName,
    barcode,
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

  try {
    const existing = await prisma.product.findUnique({ where: { id: productId } });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Product Type is immutable once created — the schema's per-type detail
    // table (and the DB triggers that enforce "exactly one matching detail
    // row") make swapping types after creation a data-migration operation,
    // not a simple field edit. The form disables the selector in edit mode;
    // this is the server-side backstop for that rule.
    const type = existing.type;

    const product = await prisma.$transaction(async (tx) => {
      const updated = await tx.product.update({
        where: { id: productId },
        data: {
          code,
          description,
          shortName: shortName !== undefined ? shortName || null : undefined,
          barcode: barcode !== undefined ? barcode || null : undefined,
          productSubGroupId: productSubGroupId !== undefined ? Number(productSubGroupId) : undefined,
          isActive,
        },
      });

      if (type === "STOCK") {
        await tx.stockDetail.update({
          where: { productId },
          data: {
            baseUnitId: baseUnitId !== undefined ? Number(baseUnitId) : undefined,
            stockCategoryId: stockCategoryId === null ? null : stockCategoryId !== undefined ? Number(stockCategoryId) : undefined,
            defaultLocationId:
              defaultLocationId === null ? null : defaultLocationId !== undefined ? Number(defaultLocationId) : undefined,
            taxRateId: taxRateId === null ? null : taxRateId !== undefined ? Number(taxRateId) : undefined,
            valuationMethod,
            tracksBatch: typeof tracksBatch === "boolean" ? tracksBatch : undefined,
            tracksExpiry: typeof tracksExpiry === "boolean" ? tracksExpiry : undefined,
            purchaseRate: purchaseRate !== undefined ? (purchaseRate ? Number(purchaseRate) : null) : undefined,
            salesRate: salesRate !== undefined ? (salesRate ? Number(salesRate) : null) : undefined,
            mrp: mrp !== undefined ? (mrp ? Number(mrp) : null) : undefined,
            tradePrice: tradePrice !== undefined ? (tradePrice ? Number(tradePrice) : null) : undefined,
            minStock: minStock !== undefined ? (minStock ? Number(minStock) : null) : undefined,
            maxStock: maxStock !== undefined ? (maxStock ? Number(maxStock) : null) : undefined,
            reorderLevel: reorderLevel !== undefined ? (reorderLevel ? Number(reorderLevel) : null) : undefined,
            reorderQty: reorderQty !== undefined ? (reorderQty ? Number(reorderQty) : null) : undefined,
            openingGLId: openingGLId === null ? null : openingGLId !== undefined ? Number(openingGLId) : undefined,
            closingPLGLId: closingPLGLId === null ? null : closingPLGLId !== undefined ? Number(closingPLGLId) : undefined,
            closingBSGLId: closingBSGLId === null ? null : closingBSGLId !== undefined ? Number(closingBSGLId) : undefined,
            purchaseGLId: purchaseGLId === null ? null : purchaseGLId !== undefined ? Number(purchaseGLId) : undefined,
            purchaseReturnGLId:
              purchaseReturnGLId === null ? null : purchaseReturnGLId !== undefined ? Number(purchaseReturnGLId) : undefined,
            salesGLId: salesGLId === null ? null : salesGLId !== undefined ? Number(salesGLId) : undefined,
            salesReturnGLId:
              salesReturnGLId === null ? null : salesReturnGLId !== undefined ? Number(salesReturnGLId) : undefined,
            defaultVendorId:
              defaultVendorId === null ? null : defaultVendorId !== undefined ? Number(defaultVendorId) : undefined,
          },
        });

        if (Array.isArray(alternateUnits)) {
          const stockDetail = await tx.stockDetail.findUniqueOrThrow({ where: { productId } });
          await tx.alternateUnit.deleteMany({ where: { stockDetailId: stockDetail.id } });
          const rows = alternateUnits.filter(
            (au: { unitId?: string | number }) => au?.unitId
          ) as { unitId: string | number; conversionFactor: string | number }[];
          if (rows.length > 0) {
            await tx.alternateUnit.createMany({
              data: rows.map((au) => ({
                stockDetailId: stockDetail.id,
                unitId: Number(au.unitId),
                conversionFactor: Number(au.conversionFactor),
              })),
            });
          }
        }
      } else if (type === "NON_STOCK") {
        await tx.nonStockDetail.update({
          where: { productId },
          data: {
            unitId: unitId !== undefined ? Number(unitId) : undefined,
            taxRateId: taxRateId === null ? null : taxRateId !== undefined ? Number(taxRateId) : undefined,
            salesGLId: nsSalesGLId !== undefined ? Number(nsSalesGLId) : undefined,
            purchaseGLId: nsPurchaseGLId !== undefined ? Number(nsPurchaseGLId) : undefined,
          },
        });
      } else if (type === "SERVICE") {
        await tx.serviceDetail.update({
          where: { productId },
          data: {
            unitId: svUnitId === null ? null : svUnitId !== undefined ? Number(svUnitId) : undefined,
            taxRateId: taxRateId === null ? null : taxRateId !== undefined ? Number(taxRateId) : undefined,
            salesGLId: svSalesGLId !== undefined ? Number(svSalesGLId) : undefined,
            purchaseGLId: svPurchaseGLId !== undefined ? Number(svPurchaseGLId) : undefined,
          },
        });
      } else if (type === "FIXED_ASSET") {
        await tx.fixedAssetDetail.update({
          where: { productId },
          data: {
            assetGLId: assetGLId !== undefined ? Number(assetGLId) : undefined,
            accumulatedDeprGLId: accumulatedDeprGLId !== undefined ? Number(accumulatedDeprGLId) : undefined,
            depreciationExpenseGLId:
              depreciationExpenseGLId !== undefined ? Number(depreciationExpenseGLId) : undefined,
            locationId: locationId === null ? null : locationId !== undefined ? Number(locationId) : undefined,
            purchaseDate: purchaseDate !== undefined ? (purchaseDate ? new Date(purchaseDate) : null) : undefined,
            originalCost: originalCost !== undefined ? (originalCost ? Number(originalCost) : null) : undefined,
            salvageValue: salvageValue !== undefined ? Number(salvageValue) || 0 : undefined,
            usefulLifeYears:
              usefulLifeYears !== undefined ? (usefulLifeYears ? Number(usefulLifeYears) : null) : undefined,
            depreciationMethod,
            depreciationRatePercent:
              depreciationRatePercent !== undefined
                ? depreciationRatePercent
                  ? Number(depreciationRatePercent)
                  : null
                : undefined,
          },
        });
      } else if (type === "BUNDLE") {
        await tx.bundleDetail.update({
          where: { productId },
          data: {
            salesGLId: bundleSalesGLId !== undefined ? Number(bundleSalesGLId) : undefined,
            bundlePrice: bundlePrice !== undefined ? (bundlePrice ? Number(bundlePrice) : null) : undefined,
          },
        });

        if (Array.isArray(components)) {
          const bundleDetail = await tx.bundleDetail.findUniqueOrThrow({ where: { productId } });
          await tx.bundleComponent.deleteMany({ where: { bundleDetailId: bundleDetail.id } });
          const rows = components as { componentProductId: string | number; quantity: string | number }[];
          if (rows.length > 0) {
            await tx.bundleComponent.createMany({
              data: rows.map((c) => ({
                bundleDetailId: bundleDetail.id,
                componentProductId: Number(c.componentProductId),
                quantity: Number(c.quantity),
              })),
            });
          }
        }
      }

      return updated;
    });

    return NextResponse.json(product);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json(
        { error: "A product with that code or barcode already exists." },
        { status: 409 }
      );
    }
    const message = err instanceof Error ? err.message : "Failed to update product.";
    console.error(err);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const productId = Number(id);

  // Same dependent-record guard convention as account-groups/parties: a
  // product still referenced as a Bundle component (onDelete: Restrict on
  // BundleComponent.componentProductId) can't be deleted until it's removed
  // from that bundle first.
  const componentOfCount = await prisma.bundleComponent.count({ where: { componentProductId: productId } });
  if (componentOfCount > 0) {
    return NextResponse.json(
      {
        error: `Cannot delete: this product is used as a component in ${componentOfCount} bundle(s). Remove it from those bundles first.`,
      },
      { status: 409 }
    );
  }

  try {
    // Deletes the Product header and its single type-specific detail row
    // (StockDetail/NonStockDetail/ServiceDetail/FixedAssetDetail/
    // BundleDetail all cascade from Product), plus AlternateUnit/
    // BundleComponent rows that cascade from the detail row.
    await prisma.product.delete({ where: { id: productId } });
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete product.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
