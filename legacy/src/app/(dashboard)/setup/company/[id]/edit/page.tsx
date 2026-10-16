import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import CompanyForm from "@/components/companies/CompanyForm";
import CompanyInfoPanel from "@/components/companies/CompanyInfoPanel";

export const dynamic = "force-dynamic";

export default async function EditCompanyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const company = await prisma.company.findUnique({ where: { id: Number(id) } });
  if (!company) notFound();

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Edit Company</h1>
          <div className="mt-1 flex items-center gap-1.5 text-sm">
            <Link href="/setup/company" className="text-brand hover:underline">
              Company
            </Link>
            <span className="text-slate-400">&gt;</span>
            <span className="text-slate-500">Edit {company.code}</span>
          </div>
        </div>
        <Link
          href={`/setup/company/${company.id}`}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <ArrowLeft size={16} />
          Back to Company
        </Link>
      </div>

      <div className="my-5 border-t border-slate-200" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
        <CompanyForm
          initial={{
            id: company.id,
            code: company.code,
            name: company.name,
            legalName: company.legalName ?? "",
            businessType: company.businessType,
            registrationNo: company.registrationNo ?? "",
            panNo: company.panNo ?? "",
            vatNo: company.vatNo ?? "",
            isVatRegistered: company.isVatRegistered,
            taxOfficeName: company.taxOfficeName ?? "",
            address: company.address ?? "",
            city: company.city ?? "",
            district: company.district ?? "",
            province: company.province ?? "",
            country: company.country ?? "",
            phone: company.phone ?? "",
            email: company.email ?? "",
            website: company.website ?? "",
            baseCurrency: company.baseCurrency,
            defaultCalendarPref: company.defaultCalendarPref,
            status: company.isActive ? "ACTIVE" : "INACTIVE",
          }}
        />
        <CompanyInfoPanel />
      </div>
    </div>
  );
}
