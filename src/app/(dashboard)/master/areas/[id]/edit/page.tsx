import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import AreaForm from "@/components/areas/AreaForm";
import AreaInfoPanel from "@/components/areas/AreaInfoPanel";

export const dynamic = "force-dynamic";

export default async function EditAreaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const area = await prisma.area.findUnique({ where: { id: Number(id) } });
  if (!area) notFound();

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Edit Area</h1>
          <div className="mt-1 flex items-center gap-1.5 text-sm">
            <Link href="/master/areas" className="text-brand hover:underline">
              Area Master
            </Link>
            <span className="text-slate-400">&gt;</span>
            <span className="text-slate-500">Edit {area.code}</span>
          </div>
        </div>
        <Link
          href={`/master/areas/${area.id}`}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <ArrowLeft size={16} />
          Back to Area
        </Link>
      </div>

      <div className="my-5 border-t border-slate-200" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
        <AreaForm
          initial={{
            id: area.id,
            code: area.code,
            name: area.name,
            shortName: area.shortName,
            status: area.isActive ? "ACTIVE" : "INACTIVE",
          }}
        />
        <AreaInfoPanel />
      </div>
    </div>
  );
}
