import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import UnitForm from "@/components/units/UnitForm";

export const dynamic = "force-dynamic";

export default async function EditUnitPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const unit = await prisma.productUnit.findUnique({ where: { id: Number(id) } });
  if (!unit) notFound();

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Edit Unit</h1>
          <div className="mt-1 flex items-center gap-1.5 text-sm">
            <Link href="/master/units" className="text-brand hover:underline">
              Unit Master
            </Link>
            <span className="text-slate-400">&gt;</span>
            <span className="text-slate-500">Edit {unit.code}</span>
          </div>
        </div>
        <Link
          href={`/master/units/${unit.id}`}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <ArrowLeft size={16} />
          Back to Unit
        </Link>
      </div>

      <div className="my-5 border-t border-slate-200" />

      <div className="max-w-2xl">
        <UnitForm
          initial={{
            id: unit.id,
            code: unit.code,
            name: unit.name,
            decimalPlaces: unit.decimalPlaces,
            status: unit.isActive ? "ACTIVE" : "INACTIVE",
          }}
        />
      </div>
    </div>
  );
}
