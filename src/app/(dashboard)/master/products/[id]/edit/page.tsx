import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import ProductForm, { type ProductFormInitial } from "@/components/products/ProductForm";
import ProductInfoPanel from "@/components/products/ProductInfoPanel";
import type { ProductType, ValuationMethod, DepreciationMethod } from "@/lib/constants";

export const dynamic = "force-dynamic";

function d(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value);
}

function dateInput(value: Date | null): string {
  if (!value) return "";
  return value.toISOString().slice(0, 10);
}

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id: Number(id) },
    include: {
      productSubGroup: true,
      stockDetail: { include: { alternateUnits: true } },
      nonStockDetail: true,
      serviceDetail: true,
      fixedAssetDetail: true,
      bundleDetail: { include: { components: true } },
    },
  });
  if (!product) notFound();

  const initial: ProductFormInitial = {
    id: product.id,
    code: product.code,
    description: product.description,
    shortName: product.shortName ?? "",
    barcode: product.barcode ?? "",
    type: product.type as ProductType,
    productGroupId: product.productSubGroup.productGroupId,
    productSubGroupId: product.productSubGroupId,
    status: product.isActive ? "ACTIVE" : "INACTIVE",
    // STOCK
    baseUnitId: product.stockDetail?.baseUnitId ?? null,
    stockCategoryId: product.stockDetail?.stockCategoryId ?? null,
    defaultLocationId: product.stockDetail?.defaultLocationId ?? null,
    taxRateId: product.stockDetail?.taxRateId ?? product.nonStockDetail?.taxRateId ?? product.serviceDetail?.taxRateId ?? null,
    valuationMethod: (product.stockDetail?.valuationMethod as ValuationMethod) ?? "WEIGHTED_AVERAGE",
    tracksBatch: product.stockDetail?.tracksBatch ?? false,
    tracksExpiry: product.stockDetail?.tracksExpiry ?? false,
    purchaseRate: d(product.stockDetail?.purchaseRate),
    salesRate: d(product.stockDetail?.salesRate),
    mrp: d(product.stockDetail?.mrp),
    tradePrice: d(product.stockDetail?.tradePrice),
    minStock: d(product.stockDetail?.minStock),
    maxStock: d(product.stockDetail?.maxStock),
    reorderLevel: d(product.stockDetail?.reorderLevel),
    reorderQty: d(product.stockDetail?.reorderQty),
    openingGLId: product.stockDetail?.openingGLId ?? null,
    closingPLGLId: product.stockDetail?.closingPLGLId ?? null,
    closingBSGLId: product.stockDetail?.closingBSGLId ?? null,
    purchaseGLId: product.stockDetail?.purchaseGLId ?? null,
    purchaseReturnGLId: product.stockDetail?.purchaseReturnGLId ?? null,
    salesGLId: product.stockDetail?.salesGLId ?? null,
    salesReturnGLId: product.stockDetail?.salesReturnGLId ?? null,
    defaultVendorId: product.stockDetail?.defaultVendorId ?? null,
    alternateUnits: (product.stockDetail?.alternateUnits ?? []).map((au) => ({
      unitId: String(au.unitId),
      conversionFactor: d(au.conversionFactor),
    })),
    // NON_STOCK
    unitId: product.nonStockDetail?.unitId ?? null,
    nsSalesGLId: product.nonStockDetail?.salesGLId ?? null,
    nsPurchaseGLId: product.nonStockDetail?.purchaseGLId ?? null,
    // SERVICE
    svUnitId: product.serviceDetail?.unitId ?? null,
    svSalesGLId: product.serviceDetail?.salesGLId ?? null,
    svPurchaseGLId: product.serviceDetail?.purchaseGLId ?? null,
    // FIXED_ASSET
    assetGLId: product.fixedAssetDetail?.assetGLId ?? null,
    accumulatedDeprGLId: product.fixedAssetDetail?.accumulatedDeprGLId ?? null,
    depreciationExpenseGLId: product.fixedAssetDetail?.depreciationExpenseGLId ?? null,
    locationId: product.fixedAssetDetail?.locationId ?? null,
    purchaseDate: dateInput(product.fixedAssetDetail?.purchaseDate ?? null),
    originalCost: d(product.fixedAssetDetail?.originalCost),
    salvageValue: product.fixedAssetDetail ? d(product.fixedAssetDetail.salvageValue) : "0",
    usefulLifeYears: d(product.fixedAssetDetail?.usefulLifeYears),
    depreciationMethod: (product.fixedAssetDetail?.depreciationMethod as DepreciationMethod) ?? "STRAIGHT_LINE",
    depreciationRatePercent: d(product.fixedAssetDetail?.depreciationRatePercent),
    // BUNDLE
    bundleSalesGLId: product.bundleDetail?.salesGLId ?? null,
    bundlePrice: d(product.bundleDetail?.bundlePrice),
    components: (product.bundleDetail?.components ?? []).map((c) => ({
      componentProductId: String(c.componentProductId),
      quantity: d(c.quantity),
    })),
  };

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Edit Product</h1>
          <div className="mt-1 flex items-center gap-1.5 text-sm">
            <Link href="/master/products" className="text-brand hover:underline">
              Product Master
            </Link>
            <span className="text-slate-400">&gt;</span>
            <span className="text-slate-500">Edit {product.code}</span>
          </div>
        </div>
        <Link
          href={`/master/products/${product.id}`}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <ArrowLeft size={16} />
          Back to Product
        </Link>
      </div>

      <div className="my-5 border-t border-slate-200" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
        <ProductForm initial={initial} />
        <ProductInfoPanel />
      </div>
    </div>
  );
}
