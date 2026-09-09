import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import SubAreaForm from "@/components/areas/SubAreaForm";
import AreaInfoPanel from "@/components/areas/AreaInfoPanel";

export const dynamic = "force-dynamic";

export default async function EditSubAreaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const subArea = await prisma.subArea.findUnique({ where: { id: Number(id) } });
  if (!subArea) notFound();

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Edit Sub-Area</h1>
          <div className="mt-1 flex items-center gap-1.5 text-sm">
            <Link href="/master/areas/sub-areas" className="text-brand hover:underline">
              Sub-Areas
            </Link>
            <span className="text-slate-400">&gt;</span>
            <span className="text-slate-500">Edit {subArea.code}</span>
          </div>
        </div>
        <Link
          href={`/master/areas/sub-areas/${subArea.id}`}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <ArrowLeft size={16} />
          Back to Sub-Area
        </Link>
      </div>

      <div className="my-5 border-t border-slate-200" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
        <SubAreaForm
          initial={{
            id: subArea.id,
            areaId: subArea.areaId,
            code: subArea.code,
            name: subArea.name,
            shortName: subArea.shortName,
            status: subArea.isActive ? "ACTIVE" : "INACTIVE",
          }}
        />
        <AreaInfoPanel />
      </div>
    </div>
  );
}
