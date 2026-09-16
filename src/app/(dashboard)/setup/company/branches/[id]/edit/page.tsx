import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import BranchForm from "@/components/companies/BranchForm";
import CompanyInfoPanel from "@/components/companies/CompanyInfoPanel";

export const dynamic = "force-dynamic";

export default async function EditBranchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const branch = await prisma.branch.findUnique({
    where: { id: Number(id) },
    include: { company: { select: { name: true } } },
  });
  if (!branch) notFound();

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Edit Branch</h1>
          <div className="mt-1 flex items-center gap-1.5 text-sm">
            <Link href="/setup/company" className="text-brand hover:underline">
              Company
            </Link>
            <span className="text-slate-400">&gt;</span>
            <span className="text-slate-500">Edit {branch.code}</span>
          </div>
        </div>
        <Link
          href={`/setup/company/branches/${branch.id}`}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <ArrowLeft size={16} />
          Back to Branch
        </Link>
      </div>

      <div className="my-5 border-t border-slate-200" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
        <BranchForm
          initial={{
            id: branch.id,
            companyId: branch.companyId,
            code: branch.code,
            name: branch.name,
            isHeadOffice: branch.isHeadOffice,
            address: branch.address ?? "",
            phone: branch.phone ?? "",
            email: branch.email ?? "",
            status: branch.isActive ? "ACTIVE" : "INACTIVE",
          }}
        />
        <CompanyInfoPanel />
      </div>
    </div>
  );
}
