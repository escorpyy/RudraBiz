import Link from "next/link";
import { Plus, Boxes, CheckCircle2, Package } from "lucide-react";
import { prisma } from "@/lib/prisma";
import StatCard from "@/components/account-groups/StatCard";
import ProductsTable, { type ProductRow } from "@/components/products/ProductsTable";
import type { ProductType } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const products = await prisma.product.findMany({
    orderBy: { code: "asc" },
    include: { productSubGroup: { include: { productGroup: true } } },
  });

  const rows: ProductRow[] = products.map((p) => ({
    id: p.id,
    code: p.code,
    description: p.description,
    type: p.type as ProductType,
    groupName: p.productSubGroup.productGroup.name,
    subGroupName: p.productSubGroup.name,
    isActive: p.isActive,
  }));

  const activeCount = rows.filter((r) => r.isActive).length;
  const stockCount = rows.filter((r) => r.type === "STOCK").length;

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Product Master</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage Stock, Non-Stock, Service, Fixed Asset, and Bundle products
          </p>
        </div>
        <Link
          href="/master/products/new"
          className="flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-hover"
        >
          <Plus size={16} />
          New Product
        </Link>
      </div>

      {/* Stat cards */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          icon={Boxes}
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
          label="Products"
          value={rows.length}
          caption="Across all product types"
        />
        <StatCard
          icon={CheckCircle2}
          iconBg="bg-emerald-100"
          iconColor="text-emerald-600"
          label="Active"
          value={activeCount}
          caption="Available for transactions"
        />
        <StatCard
          icon={Package}
          iconBg="bg-amber-100"
          iconColor="text-amber-600"
          label="Stock Items"
          value={stockCount}
          caption="Quantity-tracked products"
        />
      </div>

      <div className="mt-6">
        <ProductsTable rows={rows} />
      </div>
    </div>
  );
}
