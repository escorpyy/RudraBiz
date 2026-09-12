"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  Layers,
  Ruler,
  Tags,
  MapPinned,
  Landmark,
  Truck,
  Save,
  Plus,
  Trash2,
  Package,
} from "lucide-react";
import {
  PRODUCT_TYPE_LIST,
  PRODUCT_TYPES,
  VALUATION_METHODS,
  DEPRECIATION_METHODS,
  type ProductType,
  type ValuationMethod,
  type DepreciationMethod,
  type RecordStatus,
} from "@/lib/constants";
import Combobox, { type ComboboxOption } from "@/components/shared/Combobox";

type ProductSubGroupOption = { id: number; code: string; name: string; isActive: boolean };
type ProductGroupOption = { id: number; code: string; name: string; subGroups: ProductSubGroupOption[] };
type UnitOption = { id: number; code: string; name: string; decimalPlaces: number };
type TaxRateOption = { id: number; code: string; name: string; ratePercent: string };
type StockCategoryOption = { id: number; code: string; name: string };
type LocationOption = { id: number; code: string; name: string; parentName: string | null };
type GLOption = { id: number; code: string; name: string };
type PartyOption = { id: number; code: string; name: string };
type ProductOption = { id: number; code: string; description: string; type: ProductType };

type AlternateUnitRow = { unitId: string; conversionFactor: string };
type BundleComponentRow = { componentProductId: string; quantity: string };

export type ProductFormInitial = {
  id: number;
  code: string;
  description: string;
  shortName: string;
  barcode: string;
  type: ProductType;
  productGroupId: number;
  productSubGroupId: number;
  status: RecordStatus;
  // STOCK
  baseUnitId: number | null;
  stockCategoryId: number | null;
  defaultLocationId: number | null;
  taxRateId: number | null;
  valuationMethod: ValuationMethod;
  tracksBatch: boolean;
  tracksExpiry: boolean;
  purchaseRate: string;
  salesRate: string;
  mrp: string;
  tradePrice: string;
  minStock: string;
  maxStock: string;
  reorderLevel: string;
  reorderQty: string;
  openingGLId: number | null;
  closingPLGLId: number | null;
  closingBSGLId: number | null;
  purchaseGLId: number | null;
  purchaseReturnGLId: number | null;
  salesGLId: number | null;
  salesReturnGLId: number | null;
  defaultVendorId: number | null;
  alternateUnits: AlternateUnitRow[];
  // NON_STOCK
  unitId: number | null;
  nsSalesGLId: number | null;
  nsPurchaseGLId: number | null;
  // SERVICE
  svUnitId: number | null;
  svSalesGLId: number | null;
  svPurchaseGLId: number | null;
  // FIXED_ASSET
  assetGLId: number | null;
  accumulatedDeprGLId: number | null;
  depreciationExpenseGLId: number | null;
  locationId: number | null;
  purchaseDate: string;
  originalCost: string;
  salvageValue: string;
  usefulLifeYears: string;
  depreciationMethod: DepreciationMethod;
  depreciationRatePercent: string;
  // BUNDLE
  bundleSalesGLId: number | null;
  bundlePrice: string;
  components: BundleComponentRow[];
};

export default function ProductForm({ initial }: { initial?: ProductFormInitial }) {
  const router = useRouter();
  const isEdit = Boolean(initial);

  const [productGroups, setProductGroups] = useState<ProductGroupOption[]>([]);
  const [units, setUnits] = useState<UnitOption[]>([]);
  const [taxRates, setTaxRates] = useState<TaxRateOption[]>([]);
  const [stockCategories, setStockCategories] = useState<StockCategoryOption[]>([]);
  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [generalLedgers, setGeneralLedgers] = useState<GLOption[]>([]);
  const [parties, setParties] = useState<PartyOption[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);

  // Basic info
  const [code, setCode] = useState(initial?.code ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [shortName, setShortName] = useState(initial?.shortName ?? "");
  const [barcode, setBarcode] = useState(initial?.barcode ?? "");
  const [type, setType] = useState<ProductType>(initial?.type ?? "STOCK");
  const [productGroupId, setProductGroupId] = useState(initial ? String(initial.productGroupId) : "");
  const [productSubGroupId, setProductSubGroupId] = useState(
    initial ? String(initial.productSubGroupId) : ""
  );
  const [status, setStatus] = useState<RecordStatus>(initial?.status ?? "ACTIVE");

  // STOCK
  const [baseUnitId, setBaseUnitId] = useState(initial?.baseUnitId ? String(initial.baseUnitId) : "");
  const [stockCategoryId, setStockCategoryId] = useState(
    initial?.stockCategoryId ? String(initial.stockCategoryId) : ""
  );
  const [defaultLocationId, setDefaultLocationId] = useState(
    initial?.defaultLocationId ? String(initial.defaultLocationId) : ""
  );
  const [stockTaxRateId, setStockTaxRateId] = useState(initial?.taxRateId ? String(initial.taxRateId) : "");
  const [valuationMethod, setValuationMethod] = useState<ValuationMethod>(
    initial?.valuationMethod ?? "WEIGHTED_AVERAGE"
  );
  const [tracksBatch, setTracksBatch] = useState(initial?.tracksBatch ?? false);
  const [tracksExpiry, setTracksExpiry] = useState(initial?.tracksExpiry ?? false);
  const [purchaseRate, setPurchaseRate] = useState(initial?.purchaseRate ?? "");
  const [salesRate, setSalesRate] = useState(initial?.salesRate ?? "");
  const [mrp, setMrp] = useState(initial?.mrp ?? "");
  const [tradePrice, setTradePrice] = useState(initial?.tradePrice ?? "");
  const [minStock, setMinStock] = useState(initial?.minStock ?? "");
  const [maxStock, setMaxStock] = useState(initial?.maxStock ?? "");
  const [reorderLevel, setReorderLevel] = useState(initial?.reorderLevel ?? "");
  const [reorderQty, setReorderQty] = useState(initial?.reorderQty ?? "");
  const [openingGLId, setOpeningGLId] = useState(initial?.openingGLId ? String(initial.openingGLId) : "");
  const [closingPLGLId, setClosingPLGLId] = useState(initial?.closingPLGLId ? String(initial.closingPLGLId) : "");
  const [closingBSGLId, setClosingBSGLId] = useState(initial?.closingBSGLId ? String(initial.closingBSGLId) : "");
  const [stockPurchaseGLId, setStockPurchaseGLId] = useState(
    initial?.purchaseGLId ? String(initial.purchaseGLId) : ""
  );
  const [purchaseReturnGLId, setPurchaseReturnGLId] = useState(
    initial?.purchaseReturnGLId ? String(initial.purchaseReturnGLId) : ""
  );
  const [stockSalesGLId, setStockSalesGLId] = useState(initial?.salesGLId ? String(initial.salesGLId) : "");
  const [salesReturnGLId, setSalesReturnGLId] = useState(
    initial?.salesReturnGLId ? String(initial.salesReturnGLId) : ""
  );
  const [defaultVendorId, setDefaultVendorId] = useState(
    initial?.defaultVendorId ? String(initial.defaultVendorId) : ""
  );
  const [alternateUnits, setAlternateUnits] = useState<AlternateUnitRow[]>(initial?.alternateUnits ?? []);

  // NON_STOCK
  const [unitId, setUnitId] = useState(initial?.unitId ? String(initial.unitId) : "");
  const [nsSalesGLId, setNsSalesGLId] = useState(initial?.nsSalesGLId ? String(initial.nsSalesGLId) : "");
  const [nsPurchaseGLId, setNsPurchaseGLId] = useState(
    initial?.nsPurchaseGLId ? String(initial.nsPurchaseGLId) : ""
  );

  // SERVICE
  const [svUnitId, setSvUnitId] = useState(initial?.svUnitId ? String(initial.svUnitId) : "");
  const [svSalesGLId, setSvSalesGLId] = useState(initial?.svSalesGLId ? String(initial.svSalesGLId) : "");
  const [svPurchaseGLId, setSvPurchaseGLId] = useState(
    initial?.svPurchaseGLId ? String(initial.svPurchaseGLId) : ""
  );

  // FIXED_ASSET
  const [assetGLId, setAssetGLId] = useState(initial?.assetGLId ? String(initial.assetGLId) : "");
  const [accumulatedDeprGLId, setAccumulatedDeprGLId] = useState(
    initial?.accumulatedDeprGLId ? String(initial.accumulatedDeprGLId) : ""
  );
  const [depreciationExpenseGLId, setDepreciationExpenseGLId] = useState(
    initial?.depreciationExpenseGLId ? String(initial.depreciationExpenseGLId) : ""
  );
  const [locationId, setLocationId] = useState(initial?.locationId ? String(initial.locationId) : "");
  const [purchaseDate, setPurchaseDate] = useState(initial?.purchaseDate ?? "");
  const [originalCost, setOriginalCost] = useState(initial?.originalCost ?? "");
  const [salvageValue, setSalvageValue] = useState(initial?.salvageValue ?? "0");
  const [usefulLifeYears, setUsefulLifeYears] = useState(initial?.usefulLifeYears ?? "");
  const [depreciationMethod, setDepreciationMethod] = useState<DepreciationMethod>(
    initial?.depreciationMethod ?? "STRAIGHT_LINE"
  );
  const [depreciationRatePercent, setDepreciationRatePercent] = useState(
    initial?.depreciationRatePercent ?? ""
  );

  // BUNDLE
  const [bundleSalesGLId, setBundleSalesGLId] = useState(
    initial?.bundleSalesGLId ? String(initial.bundleSalesGLId) : ""
  );
  const [bundlePrice, setBundlePrice] = useState(initial?.bundlePrice ?? "");
  const [components, setComponents] = useState<BundleComponentRow[]>(initial?.components ?? []);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/product-groups")
      .then((r) => r.json())
      .then((rows) =>
        setProductGroups(
          rows
            .filter((g: ProductGroupOption & { isActive: boolean }) => g.isActive)
            .map((g: ProductGroupOption & { isActive: boolean }) => ({
              ...g,
              subGroups: g.subGroups.filter((sg) => sg.isActive),
            }))
        )
      )
      .catch(() => setProductGroups([]));
    fetch("/api/product-units")
      .then((r) => r.json())
      .then((rows) => setUnits(rows.filter((u: UnitOption & { isActive: boolean }) => u.isActive)))
      .catch(() => setUnits([]));
    fetch("/api/tax-rates")
      .then((r) => r.json())
      .then((rows) => setTaxRates(rows.filter((t: TaxRateOption & { isActive: boolean }) => t.isActive)))
      .catch(() => setTaxRates([]));
    fetch("/api/stock-categories")
      .then((r) => r.json())
      .then((rows) => setStockCategories(rows.filter((c: StockCategoryOption & { isActive: boolean }) => c.isActive)))
      .catch(() => setStockCategories([]));
    fetch("/api/locations")
      .then((r) => r.json())
      .then((rows) => setLocations(rows.filter((l: LocationOption & { isActive: boolean }) => l.isActive)))
      .catch(() => setLocations([]));
    fetch("/api/general-ledgers").then((r) => r.json()).then(setGeneralLedgers).catch(() => setGeneralLedgers([]));
    fetch("/api/parties").then((r) => r.json()).then(setParties).catch(() => setParties([]));
    fetch("/api/products").then((r) => r.json()).then(setProducts).catch(() => setProducts([]));
  }, []);

  const selectedGroup = productGroups.find((g) => String(g.id) === productGroupId);
  const availableSubGroups = useMemo(() => selectedGroup?.subGroups ?? [], [selectedGroup]);

  const productGroupOptions: ComboboxOption[] = useMemo(
    () => productGroups.map((g) => ({ value: String(g.id), label: `${g.code} — ${g.name}` })),
    [productGroups]
  );
  const subGroupOptions: ComboboxOption[] = useMemo(
    () => availableSubGroups.map((sg) => ({ value: String(sg.id), label: `${sg.code} — ${sg.name}` })),
    [availableSubGroups]
  );
  const unitOptions: ComboboxOption[] = useMemo(
    () => units.map((u) => ({ value: String(u.id), label: `${u.code} — ${u.name}` })),
    [units]
  );
  const taxRateOptions: ComboboxOption[] = useMemo(
    () => taxRates.map((t) => ({ value: String(t.id), label: `${t.name} (${t.ratePercent}%)`, description: t.code })),
    [taxRates]
  );
  const stockCategoryOptions: ComboboxOption[] = useMemo(
    () => stockCategories.map((c) => ({ value: String(c.id), label: `${c.code} — ${c.name}` })),
    [stockCategories]
  );
  const locationOptions: ComboboxOption[] = useMemo(
    () =>
      locations.map((l) => ({
        value: String(l.id),
        label: l.name,
        description: l.parentName ? `Under ${l.parentName}` : l.code,
      })),
    [locations]
  );
  const glOptions: ComboboxOption[] = useMemo(
    () => generalLedgers.map((g) => ({ value: String(g.id), label: `${g.code} — ${g.name}` })),
    [generalLedgers]
  );
  const partyOptions: ComboboxOption[] = useMemo(
    () => parties.map((p) => ({ value: String(p.id), label: `${p.code} — ${p.name}` })),
    [parties]
  );
  // A bundle can't contain itself or another bundle (no nested bundles) —
  // enforced by a DB trigger; filtered here so the picker only ever offers
  // valid components.
  const componentProductOptions: ComboboxOption[] = useMemo(
    () =>
      products
        .filter((p) => p.type !== "BUNDLE" && p.id !== initial?.id)
        .map((p) => ({ value: String(p.id), label: `${p.code} — ${p.description}` })),
    [products, initial?.id]
  );

  function handleGroupChange(value: string) {
    setProductGroupId(value);
    setProductSubGroupId("");
  }

  function addAlternateUnit() {
    setAlternateUnits((rows) => [...rows, { unitId: "", conversionFactor: "" }]);
  }
  function updateAlternateUnit(index: number, patch: Partial<AlternateUnitRow>) {
    setAlternateUnits((rows) => rows.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }
  function removeAlternateUnit(index: number) {
    setAlternateUnits((rows) => rows.filter((_, i) => i !== index));
  }

  function addComponent() {
    setComponents((rows) => [...rows, { componentProductId: "", quantity: "" }]);
  }
  function updateComponent(index: number, patch: Partial<BundleComponentRow>) {
    setComponents((rows) => rows.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }
  function removeComponent(index: number) {
    setComponents((rows) => rows.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!code.trim() || !description.trim() || !productGroupId || !productSubGroupId) {
      setError("Code, Description, Product Group, and Product Sub-Group are required.");
      return;
    }
    if (type === "STOCK" && !baseUnitId) {
      setError("Base Unit is required for a Stock product.");
      return;
    }
    if (type === "NON_STOCK" && (!unitId || !nsSalesGLId || !nsPurchaseGLId)) {
      setError("Unit, Sales GL, and Purchase GL are required for a Non-Stock product.");
      return;
    }
    if (type === "SERVICE" && (!svSalesGLId || !svPurchaseGLId)) {
      setError("Sales GL and Purchase GL are required for a Service product.");
      return;
    }
    if (type === "FIXED_ASSET" && (!assetGLId || !accumulatedDeprGLId || !depreciationExpenseGLId)) {
      setError("Asset GL, Accumulated Depreciation GL, and Depreciation Expense GL are required.");
      return;
    }
    if (type === "BUNDLE") {
      if (!bundleSalesGLId) {
        setError("Sales GL is required for a Bundle product.");
        return;
      }
      const validComponents = components.filter((c) => c.componentProductId && c.quantity);
      if (validComponents.length === 0) {
        setError("A Bundle needs at least one component with a quantity.");
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload = {
        code: code.trim(),
        description: description.trim(),
        shortName: shortName.trim(),
        barcode: barcode.trim(),
        type,
        productSubGroupId: Number(productSubGroupId),
        isActive: status === "ACTIVE",
        // STOCK
        baseUnitId: baseUnitId ? Number(baseUnitId) : null,
        stockCategoryId: stockCategoryId ? Number(stockCategoryId) : null,
        defaultLocationId: defaultLocationId ? Number(defaultLocationId) : null,
        taxRateId: stockTaxRateId ? Number(stockTaxRateId) : null,
        valuationMethod,
        tracksBatch,
        tracksExpiry,
        purchaseRate: purchaseRate || null,
        salesRate: salesRate || null,
        mrp: mrp || null,
        tradePrice: tradePrice || null,
        minStock: minStock || null,
        maxStock: maxStock || null,
        reorderLevel: reorderLevel || null,
        reorderQty: reorderQty || null,
        openingGLId: openingGLId ? Number(openingGLId) : null,
        closingPLGLId: closingPLGLId ? Number(closingPLGLId) : null,
        closingBSGLId: closingBSGLId ? Number(closingBSGLId) : null,
        purchaseGLId: stockPurchaseGLId ? Number(stockPurchaseGLId) : null,
        purchaseReturnGLId: purchaseReturnGLId ? Number(purchaseReturnGLId) : null,
        salesGLId: stockSalesGLId ? Number(stockSalesGLId) : null,
        salesReturnGLId: salesReturnGLId ? Number(salesReturnGLId) : null,
        defaultVendorId: defaultVendorId ? Number(defaultVendorId) : null,
        alternateUnits: alternateUnits.filter((r) => r.unitId && r.conversionFactor),
        // NON_STOCK
        unitId: unitId ? Number(unitId) : null,
        nsSalesGLId: nsSalesGLId ? Number(nsSalesGLId) : null,
        nsPurchaseGLId: nsPurchaseGLId ? Number(nsPurchaseGLId) : null,
        // SERVICE
        svUnitId: svUnitId ? Number(svUnitId) : null,
        svSalesGLId: svSalesGLId ? Number(svSalesGLId) : null,
        svPurchaseGLId: svPurchaseGLId ? Number(svPurchaseGLId) : null,
        // FIXED_ASSET
        assetGLId: assetGLId ? Number(assetGLId) : null,
        accumulatedDeprGLId: accumulatedDeprGLId ? Number(accumulatedDeprGLId) : null,
        depreciationExpenseGLId: depreciationExpenseGLId ? Number(depreciationExpenseGLId) : null,
        locationId: locationId ? Number(locationId) : null,
        purchaseDate: purchaseDate || null,
        originalCost: originalCost || null,
        salvageValue: salvageValue || 0,
        usefulLifeYears: usefulLifeYears || null,
        depreciationMethod,
        depreciationRatePercent: depreciationRatePercent || null,
        // BUNDLE
        bundleSalesGLId: bundleSalesGLId ? Number(bundleSalesGLId) : null,
        bundlePrice: bundlePrice || null,
        components: components.filter((c) => c.componentProductId && c.quantity),
      };

      const res = await fetch(isEdit ? `/api/products/${initial!.id}` : "/api/products", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to save product.");
      }

      router.push(isEdit ? `/master/products/${initial!.id}` : "/master/products");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand";
  const labelClass = "text-sm font-medium text-slate-800";
  const hintClass = "mb-2 text-xs text-slate-500";
  const sectionTitleClass = "mb-3 text-sm font-semibold text-slate-900";

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-6 shadow-card">
      <div>
        <h2 className="text-base font-semibold text-slate-900">Product Information</h2>
        <p className="mt-1 text-sm text-slate-500">
          {isEdit
            ? "Update this product's details. Product Type can't be changed after creation."
            : "Create a Stock, Non-Stock, Service, Fixed Asset, or Bundle product."}
        </p>
      </div>
      <div className="my-5 border-t border-slate-200" />

      {error && (
        <div className="mb-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {/* Basic Info */}
        <div>
          <div className={sectionTitleClass}>Basic Info</div>
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label className={labelClass}>
                  Product Code <span className="text-rose-500">*</span>
                </label>
                <p className={hintClass}>Unique code for this product.</p>
                <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="PRD-1000" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>
                  Description <span className="text-rose-500">*</span>
                </label>
                <p className={hintClass}>Full name of the product.</p>
                <input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Portland Cement 50kg Bag"
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Short Name</label>
                <input value={shortName} onChange={(e) => setShortName(e.target.value)} className={`${inputClass} mt-2`} />
              </div>
              <div>
                <label className={labelClass}>Barcode</label>
                <input value={barcode} onChange={(e) => setBarcode(e.target.value)} className={`${inputClass} mt-2`} />
              </div>
            </div>

            <div>
              <label className={labelClass}>
                Product Type <span className="text-rose-500">*</span>
              </label>
              <p className={hintClass}>
                {isEdit ? "Fixed after creation." : "Determines which detail fields apply below."}
              </p>
              <div className="relative max-w-xs">
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as ProductType)}
                  disabled={isEdit}
                  className="w-full appearance-none rounded-lg border border-slate-200 py-2.5 pl-3.5 pr-10 text-sm text-slate-800 outline-none focus:border-brand focus:ring-1 focus:ring-brand disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
                >
                  {PRODUCT_TYPE_LIST.map((t) => (
                    <option key={t} value={t}>
                      {PRODUCT_TYPES[t].label}
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label className={labelClass}>
                  Product Group <span className="text-rose-500">*</span>
                </label>
                <p className={hintClass}>Top-level catalog group.</p>
                <Combobox
                  options={productGroupOptions}
                  value={productGroupId}
                  onChange={handleGroupChange}
                  icon={Layers}
                  placeholder={productGroups.length === 0 ? "No product groups available — create one first" : "Search product groups..."}
                  emptyMessage="No product groups match your search."
                  aria-label="Product Group"
                />
              </div>
              <div>
                <label className={labelClass}>
                  Product Sub-Group <span className="text-rose-500">*</span>
                </label>
                <p className={hintClass}>{productGroupId ? "Sub-category within the group." : "Select a Product Group first."}</p>
                <Combobox
                  options={subGroupOptions}
                  value={productSubGroupId}
                  onChange={setProductSubGroupId}
                  icon={Tags}
                  disabled={!productGroupId}
                  placeholder={
                    !productGroupId
                      ? "Select a Product Group first"
                      : availableSubGroups.length === 0
                        ? "No sub-groups in this group — create one first"
                        : "Search sub-groups..."
                  }
                  emptyMessage="No sub-groups match your search."
                  aria-label="Product Sub-Group"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200" />

        {/* STOCK detail */}
        {type === "STOCK" && (
          <>
            <div>
              <div className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                <Package size={15} className="text-blue-500" />
                Stock Settings
              </div>
              <div className="space-y-5">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                  <div>
                    <label className={labelClass}>
                      Base Unit <span className="text-rose-500">*</span>
                    </label>
                    <p className={hintClass}>Unit stock quantities are recorded in.</p>
                    <Combobox
                      options={unitOptions}
                      value={baseUnitId}
                      onChange={setBaseUnitId}
                      icon={Ruler}
                      placeholder={units.length === 0 ? "No units available — create one first" : "Search units..."}
                      emptyMessage="No units match your search."
                      aria-label="Base Unit"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Stock Category</label>
                    <p className={hintClass}>Optional grouping for stock reports.</p>
                    <Combobox
                      options={stockCategoryOptions}
                      value={stockCategoryId}
                      onChange={setStockCategoryId}
                      icon={Tags}
                      placeholder={stockCategories.length === 0 ? "No categories available" : "Search categories..."}
                      emptyMessage="No categories match your search."
                      aria-label="Stock Category"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Default Location</label>
                    <p className={hintClass}>Optional default warehouse/location.</p>
                    <Combobox
                      options={locationOptions}
                      value={defaultLocationId}
                      onChange={setDefaultLocationId}
                      icon={MapPinned}
                      placeholder={locations.length === 0 ? "No locations available" : "Search locations..."}
                      emptyMessage="No locations match your search."
                      aria-label="Default Location"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label className={labelClass}>Tax Rate</label>
                    <Combobox
                      options={taxRateOptions}
                      value={stockTaxRateId}
                      onChange={setStockTaxRateId}
                      icon={Tags}
                      placeholder={taxRates.length === 0 ? "No tax rates available" : "Search tax rates..."}
                      emptyMessage="No tax rates match your search."
                      aria-label="Tax Rate"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Valuation Method</label>
                    <div className="relative">
                      <select
                        value={valuationMethod}
                        onChange={(e) => setValuationMethod(e.target.value as ValuationMethod)}
                        className="w-full appearance-none rounded-lg border border-slate-200 py-2.5 pl-3.5 pr-10 text-sm text-slate-800 outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                      >
                        {Object.entries(VALUATION_METHODS).map(([key, cfg]) => (
                          <option key={key} value={key}>
                            {cfg.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={16} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <label className="flex items-center gap-2.5 rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-700">
                    <input type="checkbox" checked={tracksBatch} onChange={(e) => setTracksBatch(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand" />
                    Tracks Batch
                  </label>
                  <label className="flex items-center gap-2.5 rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-700">
                    <input type="checkbox" checked={tracksExpiry} onChange={(e) => setTracksExpiry(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand" />
                    Tracks Expiry
                  </label>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200" />

            <div>
              <div className={sectionTitleClass}>Pricing</div>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
                <div>
                  <label className={labelClass}>Purchase Rate</label>
                  <input type="number" min="0" step="0.01" value={purchaseRate} onChange={(e) => setPurchaseRate(e.target.value)} className={`${inputClass} mt-2`} />
                </div>
                <div>
                  <label className={labelClass}>Sales Rate</label>
                  <input type="number" min="0" step="0.01" value={salesRate} onChange={(e) => setSalesRate(e.target.value)} className={`${inputClass} mt-2`} />
                </div>
                <div>
                  <label className={labelClass}>MRP</label>
                  <input type="number" min="0" step="0.01" value={mrp} onChange={(e) => setMrp(e.target.value)} className={`${inputClass} mt-2`} />
                </div>
                <div>
                  <label className={labelClass}>Trade Price</label>
                  <input type="number" min="0" step="0.01" value={tradePrice} onChange={(e) => setTradePrice(e.target.value)} className={`${inputClass} mt-2`} />
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200" />

            <div>
              <div className={sectionTitleClass}>Stock Levels</div>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
                <div>
                  <label className={labelClass}>Min Stock</label>
                  <input type="number" min="0" step="0.01" value={minStock} onChange={(e) => setMinStock(e.target.value)} className={`${inputClass} mt-2`} />
                </div>
                <div>
                  <label className={labelClass}>Max Stock</label>
                  <input type="number" min="0" step="0.01" value={maxStock} onChange={(e) => setMaxStock(e.target.value)} className={`${inputClass} mt-2`} />
                </div>
                <div>
                  <label className={labelClass}>Reorder Level</label>
                  <input type="number" min="0" step="0.01" value={reorderLevel} onChange={(e) => setReorderLevel(e.target.value)} className={`${inputClass} mt-2`} />
                </div>
                <div>
                  <label className={labelClass}>Reorder Qty</label>
                  <input type="number" min="0" step="0.01" value={reorderQty} onChange={(e) => setReorderQty(e.target.value)} className={`${inputClass} mt-2`} />
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200" />

            <div>
              <div className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                <Landmark size={15} className="text-blue-500" />
                Accounting (GL Links)
              </div>
              <p className={hintClass}>All optional — leave blank to post using the account&apos;s defaults.</p>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Opening GL</label>
                  <Combobox options={glOptions} value={openingGLId} onChange={setOpeningGLId} icon={Landmark} placeholder="Search ledgers..." emptyMessage="No ledgers match your search." aria-label="Opening GL" />
                </div>
                <div>
                  <label className={labelClass}>Closing (P&amp;L) GL</label>
                  <Combobox options={glOptions} value={closingPLGLId} onChange={setClosingPLGLId} icon={Landmark} placeholder="Search ledgers..." emptyMessage="No ledgers match your search." aria-label="Closing P&L GL" />
                </div>
                <div>
                  <label className={labelClass}>Closing (Balance Sheet) GL</label>
                  <Combobox options={glOptions} value={closingBSGLId} onChange={setClosingBSGLId} icon={Landmark} placeholder="Search ledgers..." emptyMessage="No ledgers match your search." aria-label="Closing BS GL" />
                </div>
                <div>
                  <label className={labelClass}>Purchase GL</label>
                  <Combobox options={glOptions} value={stockPurchaseGLId} onChange={setStockPurchaseGLId} icon={Landmark} placeholder="Search ledgers..." emptyMessage="No ledgers match your search." aria-label="Purchase GL" />
                </div>
                <div>
                  <label className={labelClass}>Purchase Return GL</label>
                  <Combobox options={glOptions} value={purchaseReturnGLId} onChange={setPurchaseReturnGLId} icon={Landmark} placeholder="Search ledgers..." emptyMessage="No ledgers match your search." aria-label="Purchase Return GL" />
                </div>
                <div>
                  <label className={labelClass}>Sales GL</label>
                  <Combobox options={glOptions} value={stockSalesGLId} onChange={setStockSalesGLId} icon={Landmark} placeholder="Search ledgers..." emptyMessage="No ledgers match your search." aria-label="Sales GL" />
                </div>
                <div>
                  <label className={labelClass}>Sales Return GL</label>
                  <Combobox options={glOptions} value={salesReturnGLId} onChange={setSalesReturnGLId} icon={Landmark} placeholder="Search ledgers..." emptyMessage="No ledgers match your search." aria-label="Sales Return GL" />
                </div>
                <div>
                  <label className={labelClass}>Default Vendor</label>
                  <Combobox options={partyOptions} value={defaultVendorId} onChange={setDefaultVendorId} icon={Truck} placeholder="Search parties..." emptyMessage="No parties match your search." aria-label="Default Vendor" />
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200" />

            <div>
              <div className="mb-3 flex items-center justify-between">
                <div className="text-sm font-semibold text-slate-900">Alternate Units</div>
                <button type="button" onClick={addAlternateUnit} className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
                  <Plus size={14} />
                  Add Row
                </button>
              </div>
              <p className={hintClass}>E.g. 1 Box = 12 Pcs (base unit). Optional.</p>
              <div className="space-y-3">
                {alternateUnits.map((row, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-lg border border-slate-200 p-3">
                    <div className="flex-1">
                      <Combobox
                        options={unitOptions.filter((o) => o.value !== baseUnitId)}
                        value={row.unitId}
                        onChange={(v) => updateAlternateUnit(i, { unitId: v })}
                        placeholder="Select unit..."
                        emptyMessage="No units match your search."
                        aria-label={`Alternate unit ${i + 1}`}
                      />
                    </div>
                    <input
                      type="number"
                      min="0"
                      step="0.000001"
                      value={row.conversionFactor}
                      onChange={(e) => updateAlternateUnit(i, { conversionFactor: e.target.value })}
                      placeholder="Conversion factor"
                      className="w-44 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                    />
                    <button type="button" onClick={() => removeAlternateUnit(i)} className="rounded-md p-2 text-rose-500 hover:bg-rose-50" aria-label="Remove row">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                {alternateUnits.length === 0 && <p className="text-sm text-slate-400">No alternate units added.</p>}
              </div>
            </div>
          </>
        )}

        {/* NON_STOCK detail */}
        {type === "NON_STOCK" && (
          <div>
            <div className={sectionTitleClass}>Non-Stock Settings</div>
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>
                    Unit <span className="text-rose-500">*</span>
                  </label>
                  <Combobox options={unitOptions} value={unitId} onChange={setUnitId} icon={Ruler} placeholder="Search units..." emptyMessage="No units match your search." aria-label="Unit" />
                </div>
                <div>
                  <label className={labelClass}>Tax Rate</label>
                  <Combobox options={taxRateOptions} value={stockTaxRateId} onChange={setStockTaxRateId} icon={Tags} placeholder="Search tax rates..." emptyMessage="No tax rates match your search." aria-label="Tax Rate" />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>
                    Sales GL <span className="text-rose-500">*</span>
                  </label>
                  <Combobox options={glOptions} value={nsSalesGLId} onChange={setNsSalesGLId} icon={Landmark} placeholder="Search ledgers..." emptyMessage="No ledgers match your search." aria-label="Sales GL" />
                </div>
                <div>
                  <label className={labelClass}>
                    Purchase GL <span className="text-rose-500">*</span>
                  </label>
                  <Combobox options={glOptions} value={nsPurchaseGLId} onChange={setNsPurchaseGLId} icon={Landmark} placeholder="Search ledgers..." emptyMessage="No ledgers match your search." aria-label="Purchase GL" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SERVICE detail */}
        {type === "SERVICE" && (
          <div>
            <div className={sectionTitleClass}>Service Settings</div>
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Unit</label>
                  <p className={hintClass}>Optional — e.g. per hour, per visit. Leave blank for lump-sum services.</p>
                  <Combobox options={unitOptions} value={svUnitId} onChange={setSvUnitId} icon={Ruler} placeholder="Search units..." emptyMessage="No units match your search." aria-label="Unit" />
                </div>
                <div>
                  <label className={labelClass}>Tax Rate</label>
                  <Combobox options={taxRateOptions} value={stockTaxRateId} onChange={setStockTaxRateId} icon={Tags} placeholder="Search tax rates..." emptyMessage="No tax rates match your search." aria-label="Tax Rate" />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>
                    Sales GL <span className="text-rose-500">*</span>
                  </label>
                  <Combobox options={glOptions} value={svSalesGLId} onChange={setSvSalesGLId} icon={Landmark} placeholder="Search ledgers..." emptyMessage="No ledgers match your search." aria-label="Sales GL" />
                </div>
                <div>
                  <label className={labelClass}>
                    Purchase GL <span className="text-rose-500">*</span>
                  </label>
                  <Combobox options={glOptions} value={svPurchaseGLId} onChange={setSvPurchaseGLId} icon={Landmark} placeholder="Search ledgers..." emptyMessage="No ledgers match your search." aria-label="Purchase GL" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* FIXED_ASSET detail */}
        {type === "FIXED_ASSET" && (
          <div>
            <div className={sectionTitleClass}>Fixed Asset Settings</div>
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                <div>
                  <label className={labelClass}>
                    Asset GL <span className="text-rose-500">*</span>
                  </label>
                  <Combobox options={glOptions} value={assetGLId} onChange={setAssetGLId} icon={Landmark} placeholder="Search ledgers..." emptyMessage="No ledgers match your search." aria-label="Asset GL" />
                </div>
                <div>
                  <label className={labelClass}>
                    Accumulated Depreciation GL <span className="text-rose-500">*</span>
                  </label>
                  <Combobox options={glOptions} value={accumulatedDeprGLId} onChange={setAccumulatedDeprGLId} icon={Landmark} placeholder="Search ledgers..." emptyMessage="No ledgers match your search." aria-label="Accumulated Depreciation GL" />
                </div>
                <div>
                  <label className={labelClass}>
                    Depreciation Expense GL <span className="text-rose-500">*</span>
                  </label>
                  <Combobox options={glOptions} value={depreciationExpenseGLId} onChange={setDepreciationExpenseGLId} icon={Landmark} placeholder="Search ledgers..." emptyMessage="No ledgers match your search." aria-label="Depreciation Expense GL" />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Location</label>
                  <Combobox options={locationOptions} value={locationId} onChange={setLocationId} icon={MapPinned} placeholder="Search locations..." emptyMessage="No locations match your search." aria-label="Location" />
                </div>
                <div>
                  <label className={labelClass}>Purchase Date</label>
                  <input type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} className={`${inputClass} mt-2`} />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                <div>
                  <label className={labelClass}>Original Cost</label>
                  <input type="number" min="0" step="0.01" value={originalCost} onChange={(e) => setOriginalCost(e.target.value)} className={`${inputClass} mt-2`} />
                </div>
                <div>
                  <label className={labelClass}>Salvage Value</label>
                  <input type="number" min="0" step="0.01" value={salvageValue} onChange={(e) => setSalvageValue(e.target.value)} className={`${inputClass} mt-2`} />
                </div>
                <div>
                  <label className={labelClass}>Useful Life (Years)</label>
                  <input type="number" min="0" value={usefulLifeYears} onChange={(e) => setUsefulLifeYears(e.target.value)} className={`${inputClass} mt-2`} />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Depreciation Method</label>
                  <div className="relative">
                    <select
                      value={depreciationMethod}
                      onChange={(e) => setDepreciationMethod(e.target.value as DepreciationMethod)}
                      className="w-full appearance-none rounded-lg border border-slate-200 py-2.5 pl-3.5 pr-10 text-sm text-slate-800 outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                    >
                      {Object.entries(DEPRECIATION_METHODS).map(([key, cfg]) => (
                        <option key={key} value={key}>
                          {cfg.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={16} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Depreciation Rate %</label>
                  <p className={hintClass}>Used for WDV, or as a manual override.</p>
                  <input type="number" min="0" step="0.01" value={depreciationRatePercent} onChange={(e) => setDepreciationRatePercent(e.target.value)} className={inputClass} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* BUNDLE detail */}
        {type === "BUNDLE" && (
          <div>
            <div className={sectionTitleClass}>Bundle Settings</div>
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>
                    Sales GL <span className="text-rose-500">*</span>
                  </label>
                  <Combobox options={glOptions} value={bundleSalesGLId} onChange={setBundleSalesGLId} icon={Landmark} placeholder="Search ledgers..." emptyMessage="No ledgers match your search." aria-label="Sales GL" />
                </div>
                <div>
                  <label className={labelClass}>Bundle Price</label>
                  <p className={hintClass}>Optional override — else the sum of component prices.</p>
                  <input type="number" min="0" step="0.01" value={bundlePrice} onChange={(e) => setBundlePrice(e.target.value)} className={inputClass} />
                </div>
              </div>

              <div>
                <div className="mb-3 flex items-center justify-between">
                  <label className={labelClass}>
                    Components <span className="text-rose-500">*</span>
                  </label>
                  <button type="button" onClick={addComponent} className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
                    <Plus size={14} />
                    Add Component
                  </button>
                </div>
                <p className={hintClass}>Other products included in this bundle (bundles can&apos;t contain other bundles).</p>
                <div className="space-y-3">
                  {components.map((row, i) => (
                    <div key={i} className="flex items-center gap-3 rounded-lg border border-slate-200 p-3">
                      <div className="flex-1">
                        <Combobox
                          options={componentProductOptions}
                          value={row.componentProductId}
                          onChange={(v) => updateComponent(i, { componentProductId: v })}
                          placeholder="Select product..."
                          emptyMessage="No products match your search."
                          aria-label={`Component product ${i + 1}`}
                        />
                      </div>
                      <input
                        type="number"
                        min="0"
                        step="0.000001"
                        value={row.quantity}
                        onChange={(e) => updateComponent(i, { quantity: e.target.value })}
                        placeholder="Quantity"
                        className="w-36 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                      />
                      <button type="button" onClick={() => removeComponent(i)} className="rounded-md p-2 text-rose-500 hover:bg-rose-50" aria-label="Remove component">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  {components.length === 0 && <p className="text-sm text-slate-400">No components added yet.</p>}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="border-t border-slate-200" />

        {/* Status */}
        <div>
          <label className={labelClass}>Status</label>
          <p className={hintClass}>Set active to make this product available for transactions.</p>
          <div className="relative max-w-xs">
            <span
              className={`pointer-events-none absolute left-3.5 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full ${
                status === "ACTIVE" ? "bg-emerald-500" : "bg-slate-400"
              }`}
            />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as RecordStatus)}
              className="w-full appearance-none rounded-lg border border-slate-200 py-2.5 pl-8 pr-10 text-sm text-slate-800 outline-none focus:border-brand focus:ring-1 focus:ring-brand"
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
            <ChevronDown size={16} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>
        </div>
      </div>

      <div className="my-6 border-t border-slate-200" />

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => router.push(isEdit ? `/master/products/${initial!.id}` : "/master/products")}
          className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-hover disabled:opacity-60"
        >
          <Save size={16} />
          {submitting ? "Saving..." : isEdit ? "Update Product" : "Save Product"}
        </button>
      </div>
    </form>
  );
}
