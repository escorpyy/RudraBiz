import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Ruler, Tags, MapPinned, Landmark, Truck, Boxes } from "lucide-react";
import { prisma } from "@/lib/prisma";
import ProductTypeBadge from "@/components/products/ProductTypeBadge";
import StatusBadge from "@/components/account-groups/StatusBadge";
import DetailActions from "@/components/shared/DetailActions";
import type { ProductType } from "@/lib/constants";

export const dynamic = "force-dynamic";

function fmt(value: unknown): string {
  if (value === null || value === undefined) return "—";
  const num = Number(value);
  return Number.isFinite(num) ? num.toLocaleString(undefined, { maximumFractionDigits: 6 }) : String(value);
}

export default async function ViewProductPage({ params }: { params: Promise<{ id: string }> }) {
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
        include: { salesGL: true, components: { include: { componentProduct: true } } },
      },
    },
  });
  if (!product) notFound();

  const type = product.type as ProductType;

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">{product.description}</h1>
            <ProductTypeBadge type={type} />
            <StatusBadge status={product.isActive ? "ACTIVE" : "INACTIVE"} />
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-sm">
            <Link href="/master/products" className="text-brand hover:underline">
              Product Master
            </Link>
            <span className="text-slate-400">&gt;</span>
            <span className="text-slate-500">{product.code}</span>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            href="/master/products"
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft size={16} />
            Back
          </Link>
          <DetailActions
            editHref={`/master/products/${product.id}/edit`}
            deleteUrl={`/api/products/${product.id}`}
            redirectHref="/master/products"
            entityName={product.description}
          />
        </div>
      </div>

      <div className="my-5 border-t border-slate-200" />

      {/* Basic info */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
          <div className="text-sm text-slate-500">Product Code</div>
          <div className="mt-1 text-lg font-semibold text-slate-900">{product.code}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
          <div className="text-sm text-slate-500">Product Group</div>
          <div className="mt-1 text-lg font-semibold text-slate-900">{product.productSubGroup.productGroup.name}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
          <div className="text-sm text-slate-500">Product Sub-Group</div>
          <div className="mt-1 text-lg font-semibold text-slate-900">{product.productSubGroup.name}</div>
        </div>
      </div>

      {(product.shortName || product.barcode) && (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {product.shortName && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
              <div className="text-sm text-slate-500">Short Name</div>
              <div className="mt-1 font-medium text-slate-800">{product.shortName}</div>
            </div>
          )}
          {product.barcode && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
              <div className="text-sm text-slate-500">Barcode</div>
              <div className="mt-1 font-medium text-slate-800">{product.barcode}</div>
            </div>
          )}
        </div>
      )}

      {/* STOCK */}
      {type === "STOCK" && product.stockDetail && (
        <>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
              <div className="flex items-center gap-1.5 text-sm text-slate-500">
                <Ruler size={14} />
                Base Unit
              </div>
              <div className="mt-1 font-medium text-slate-800">{product.stockDetail.baseUnit.code}</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
              <div className="flex items-center gap-1.5 text-sm text-slate-500">
                <Tags size={14} />
                Stock Category
              </div>
              <div className="mt-1 font-medium text-slate-800">{product.stockDetail.stockCategory?.name ?? "—"}</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
              <div className="flex items-center gap-1.5 text-sm text-slate-500">
                <MapPinned size={14} />
                Default Location
              </div>
              <div className="mt-1 font-medium text-slate-800">{product.stockDetail.defaultLocation?.name ?? "—"}</div>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-card">
            <div className="text-sm font-semibold text-slate-900">Valuation &amp; Tracking</div>
            <div className="mt-3 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
              <div>
                <div className="text-slate-500">Valuation Method</div>
                <div className="mt-0.5 font-medium text-slate-800">{product.stockDetail.valuationMethod.replace("_", " ")}</div>
              </div>
              <div>
                <div className="text-slate-500">Tax Rate</div>
                <div className="mt-0.5 font-medium text-slate-800">{product.stockDetail.taxRate?.name ?? "—"}</div>
              </div>
              <div>
                <div className="text-slate-500">Tracks Batch</div>
                <div className="mt-0.5 font-medium text-slate-800">{product.stockDetail.tracksBatch ? "Yes" : "No"}</div>
              </div>
              <div>
                <div className="text-slate-500">Tracks Expiry</div>
                <div className="mt-0.5 font-medium text-slate-800">{product.stockDetail.tracksExpiry ? "Yes" : "No"}</div>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-card">
            <div className="text-sm font-semibold text-slate-900">Pricing</div>
            <div className="mt-3 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
              <div>
                <div className="text-slate-500">Purchase Rate</div>
                <div className="mt-0.5 font-medium text-slate-800">{fmt(product.stockDetail.purchaseRate)}</div>
              </div>
              <div>
                <div className="text-slate-500">Sales Rate</div>
                <div className="mt-0.5 font-medium text-slate-800">{fmt(product.stockDetail.salesRate)}</div>
              </div>
              <div>
                <div className="text-slate-500">MRP</div>
                <div className="mt-0.5 font-medium text-slate-800">{fmt(product.stockDetail.mrp)}</div>
              </div>
              <div>
                <div className="text-slate-500">Trade Price</div>
                <div className="mt-0.5 font-medium text-slate-800">{fmt(product.stockDetail.tradePrice)}</div>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-card">
            <div className="text-sm font-semibold text-slate-900">Stock Levels</div>
            <div className="mt-3 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
              <div>
                <div className="text-slate-500">Min Stock</div>
                <div className="mt-0.5 font-medium text-slate-800">{fmt(product.stockDetail.minStock)}</div>
              </div>
              <div>
                <div className="text-slate-500">Max Stock</div>
                <div className="mt-0.5 font-medium text-slate-800">{fmt(product.stockDetail.maxStock)}</div>
              </div>
              <div>
                <div className="text-slate-500">Reorder Level</div>
                <div className="mt-0.5 font-medium text-slate-800">{fmt(product.stockDetail.reorderLevel)}</div>
              </div>
              <div>
                <div className="text-slate-500">Reorder Qty</div>
                <div className="mt-0.5 font-medium text-slate-800">{fmt(product.stockDetail.reorderQty)}</div>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-card">
            <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
              <Landmark size={15} className="text-blue-600" />
              Accounting (GL Links)
            </div>
            <div className="mt-3 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
              <div>
                <div className="text-slate-500">Opening GL</div>
                <div className="mt-0.5 font-medium text-slate-800">{product.stockDetail.openingGL?.code ?? "—"}</div>
              </div>
              <div>
                <div className="text-slate-500">Closing P&amp;L GL</div>
                <div className="mt-0.5 font-medium text-slate-800">{product.stockDetail.closingPLGL?.code ?? "—"}</div>
              </div>
              <div>
                <div className="text-slate-500">Closing BS GL</div>
                <div className="mt-0.5 font-medium text-slate-800">{product.stockDetail.closingBSGL?.code ?? "—"}</div>
              </div>
              <div>
                <div className="text-slate-500">Purchase GL</div>
                <div className="mt-0.5 font-medium text-slate-800">{product.stockDetail.purchaseGL?.code ?? "—"}</div>
              </div>
              <div>
                <div className="text-slate-500">Purchase Return GL</div>
                <div className="mt-0.5 font-medium text-slate-800">{product.stockDetail.purchaseReturnGL?.code ?? "—"}</div>
              </div>
              <div>
                <div className="text-slate-500">Sales GL</div>
                <div className="mt-0.5 font-medium text-slate-800">{product.stockDetail.salesGL?.code ?? "—"}</div>
              </div>
              <div>
                <div className="text-slate-500">Sales Return GL</div>
                <div className="mt-0.5 font-medium text-slate-800">{product.stockDetail.salesReturnGL?.code ?? "—"}</div>
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-slate-500">
                  <Truck size={13} />
                  Default Vendor
                </div>
                <div className="mt-0.5 font-medium text-slate-800">
                  {product.stockDetail.defaultVendor?.generalLedger.name ?? "—"}
                </div>
              </div>
            </div>
          </div>

          {product.stockDetail.alternateUnits.length > 0 && (
            <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-card">
              <div className="text-sm font-semibold text-slate-900">Alternate Units</div>
              <div className="mt-3 space-y-2 text-sm">
                {product.stockDetail.alternateUnits.map((au) => (
                  <div key={au.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3.5 py-2.5">
                    <span className="text-slate-800">{au.unit.name}</span>
                    <span className="text-slate-500">
                      1 {au.unit.code} = {fmt(au.conversionFactor)} {product.stockDetail!.baseUnit.code}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* NON_STOCK */}
      {type === "NON_STOCK" && product.nonStockDetail && (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
            <div className="text-sm text-slate-500">Unit</div>
            <div className="mt-1 font-medium text-slate-800">{product.nonStockDetail.unit.code}</div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
            <div className="text-sm text-slate-500">Tax Rate</div>
            <div className="mt-1 font-medium text-slate-800">{product.nonStockDetail.taxRate?.name ?? "—"}</div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
            <div className="text-sm text-slate-500">Sales GL</div>
            <div className="mt-1 font-medium text-slate-800">{product.nonStockDetail.salesGL.code}</div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
            <div className="text-sm text-slate-500">Purchase GL</div>
            <div className="mt-1 font-medium text-slate-800">{product.nonStockDetail.purchaseGL.code}</div>
          </div>
        </div>
      )}

      {/* SERVICE */}
      {type === "SERVICE" && product.serviceDetail && (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
            <div className="text-sm text-slate-500">Unit</div>
            <div className="mt-1 font-medium text-slate-800">{product.serviceDetail.unit?.code ?? "—"}</div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
            <div className="text-sm text-slate-500">Tax Rate</div>
            <div className="mt-1 font-medium text-slate-800">{product.serviceDetail.taxRate?.name ?? "—"}</div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
            <div className="text-sm text-slate-500">Sales GL</div>
            <div className="mt-1 font-medium text-slate-800">{product.serviceDetail.salesGL.code}</div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
            <div className="text-sm text-slate-500">Purchase GL</div>
            <div className="mt-1 font-medium text-slate-800">{product.serviceDetail.purchaseGL.code}</div>
          </div>
        </div>
      )}

      {/* FIXED_ASSET */}
      {type === "FIXED_ASSET" && product.fixedAssetDetail && (
        <>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
              <div className="text-sm text-slate-500">Asset GL</div>
              <div className="mt-1 font-medium text-slate-800">{product.fixedAssetDetail.assetGL.code}</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
              <div className="text-sm text-slate-500">Accumulated Depr. GL</div>
              <div className="mt-1 font-medium text-slate-800">{product.fixedAssetDetail.accumulatedDeprGL.code}</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
              <div className="text-sm text-slate-500">Depreciation Expense GL</div>
              <div className="mt-1 font-medium text-slate-800">{product.fixedAssetDetail.depreciationExpenseGL.code}</div>
            </div>
          </div>
          <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-card">
            <div className="text-sm font-semibold text-slate-900">Depreciation</div>
            <div className="mt-3 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
              <div>
                <div className="text-slate-500">Location</div>
                <div className="mt-0.5 font-medium text-slate-800">{product.fixedAssetDetail.location?.name ?? "—"}</div>
              </div>
              <div>
                <div className="text-slate-500">Purchase Date</div>
                <div className="mt-0.5 font-medium text-slate-800">
                  {product.fixedAssetDetail.purchaseDate ? new Date(product.fixedAssetDetail.purchaseDate).toLocaleDateString() : "—"}
                </div>
              </div>
              <div>
                <div className="text-slate-500">Original Cost</div>
                <div className="mt-0.5 font-medium text-slate-800">{fmt(product.fixedAssetDetail.originalCost)}</div>
              </div>
              <div>
                <div className="text-slate-500">Salvage Value</div>
                <div className="mt-0.5 font-medium text-slate-800">{fmt(product.fixedAssetDetail.salvageValue)}</div>
              </div>
              <div>
                <div className="text-slate-500">Useful Life (Years)</div>
                <div className="mt-0.5 font-medium text-slate-800">{product.fixedAssetDetail.usefulLifeYears ?? "—"}</div>
              </div>
              <div>
                <div className="text-slate-500">Method</div>
                <div className="mt-0.5 font-medium text-slate-800">{product.fixedAssetDetail.depreciationMethod.replace("_", " ")}</div>
              </div>
              <div>
                <div className="text-slate-500">Depreciation Rate %</div>
                <div className="mt-0.5 font-medium text-slate-800">{fmt(product.fixedAssetDetail.depreciationRatePercent)}</div>
              </div>
              <div>
                <div className="text-slate-500">Accumulated Depreciation</div>
                <div className="mt-0.5 font-medium text-slate-800">{fmt(product.fixedAssetDetail.accumulatedDepreciation)}</div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* BUNDLE */}
      {type === "BUNDLE" && product.bundleDetail && (
        <>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
              <div className="text-sm text-slate-500">Sales GL</div>
              <div className="mt-1 font-medium text-slate-800">{product.bundleDetail.salesGL.code}</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
              <div className="text-sm text-slate-500">Bundle Price</div>
              <div className="mt-1 font-medium text-slate-800">{fmt(product.bundleDetail.bundlePrice)}</div>
            </div>
          </div>
          <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-card">
            <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
              <Boxes size={15} className="text-emerald-600" />
              Components
            </div>
            <div className="mt-3 space-y-2 text-sm">
              {product.bundleDetail.components.map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3.5 py-2.5">
                  <Link href={`/master/products/${c.componentProduct.id}`} className="text-brand hover:underline">
                    {c.componentProduct.code} — {c.componentProduct.description}
                  </Link>
                  <span className="text-slate-500">Qty: {fmt(c.quantity)}</span>
                </div>
              ))}
              {product.bundleDetail.components.length === 0 && <p className="text-slate-400">No components.</p>}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
