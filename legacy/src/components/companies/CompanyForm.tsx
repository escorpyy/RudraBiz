"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronDown, Building2, MapPin, Phone, Landmark, Save } from "lucide-react";
import {
  BUSINESS_TYPES,
  BUSINESS_TYPE_LIST,
  CALENDAR_PREFERENCES,
  CALENDAR_PREFERENCE_LIST,
  type BusinessType,
  type CalendarPreference,
  type RecordStatus,
} from "@/lib/constants";

export type CompanyFormInitial = {
  id: number;
  code: string;
  name: string;
  legalName: string;
  businessType: BusinessType;
  registrationNo: string;
  panNo: string;
  vatNo: string;
  isVatRegistered: boolean;
  taxOfficeName: string;
  address: string;
  city: string;
  district: string;
  province: string;
  country: string;
  phone: string;
  email: string;
  website: string;
  baseCurrency: string;
  defaultCalendarPref: CalendarPreference;
  status: RecordStatus;
};

export default function CompanyForm({ initial }: { initial?: CompanyFormInitial }) {
  const router = useRouter();
  const isEdit = Boolean(initial);

  const [code, setCode] = useState(initial?.code ?? "");
  const [name, setName] = useState(initial?.name ?? "");
  const [legalName, setLegalName] = useState(initial?.legalName ?? "");
  const [businessType, setBusinessType] = useState<BusinessType>(initial?.businessType ?? "OTHER");

  const [registrationNo, setRegistrationNo] = useState(initial?.registrationNo ?? "");
  const [panNo, setPanNo] = useState(initial?.panNo ?? "");
  const [vatNo, setVatNo] = useState(initial?.vatNo ?? "");
  const [isVatRegistered, setIsVatRegistered] = useState(initial?.isVatRegistered ?? false);
  const [taxOfficeName, setTaxOfficeName] = useState(initial?.taxOfficeName ?? "");

  const [address, setAddress] = useState(initial?.address ?? "");
  const [city, setCity] = useState(initial?.city ?? "");
  const [district, setDistrict] = useState(initial?.district ?? "");
  const [province, setProvince] = useState(initial?.province ?? "");
  const [country, setCountry] = useState(initial?.country ?? "Nepal");

  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [website, setWebsite] = useState(initial?.website ?? "");

  const [baseCurrency, setBaseCurrency] = useState(initial?.baseCurrency ?? "NPR");
  const [defaultCalendarPref, setDefaultCalendarPref] = useState<CalendarPreference>(
    initial?.defaultCalendarPref ?? "BS"
  );
  const [status, setStatus] = useState<RecordStatus>(initial?.status ?? "ACTIVE");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputClass =
    "w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand";
  const labelClass = "text-sm font-medium text-slate-800";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!code.trim() || !name.trim()) {
      setError("Company Code and Company Name are required.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(isEdit ? `/api/companies/${initial!.id}` : "/api/companies", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: code.trim(),
          name: name.trim(),
          legalName: legalName.trim(),
          businessType,
          registrationNo: registrationNo.trim(),
          panNo: panNo.trim(),
          vatNo: vatNo.trim(),
          isVatRegistered,
          taxOfficeName: taxOfficeName.trim(),
          address: address.trim(),
          city: city.trim(),
          district: district.trim(),
          province: province.trim(),
          country: country.trim(),
          phone: phone.trim(),
          email: email.trim(),
          website: website.trim(),
          baseCurrency: baseCurrency.trim(),
          defaultCalendarPref,
          isActive: status === "ACTIVE",
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to save company.");
      }

      router.push(isEdit ? `/setup/company/${initial!.id}` : "/setup/company");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-6 shadow-card">
      <div>
        <h2 className="text-base font-semibold text-slate-900">Company Information</h2>
        <p className="mt-1 text-sm text-slate-500">
          {isEdit ? "Update details of this company." : "Provide details of the new company."}
        </p>
      </div>
      <div className="my-5 border-t border-slate-200" />

      {error && (
        <div className="mb-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="space-y-5">
        {/* Identity */}
        <div>
          <div className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-slate-900">
            <Building2 size={15} className="text-blue-500" />
            Identity
          </div>
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label className={labelClass}>
                  Company Code <span className="text-rose-500">*</span>
                </label>
                <p className="mb-2 text-xs text-slate-500">Short slug shown in the header switcher.</p>
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="ABC"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>
                  Company Name <span className="text-rose-500">*</span>
                </label>
                <p className="mb-2 text-xs text-slate-500">Trade/display name shown in the switcher.</p>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Acme Traders Pvt. Ltd."
                  className={inputClass}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Legal Name</label>
                <p className="mb-2 text-xs text-slate-500">Full registered name, for statutory documents.</p>
                <input
                  value={legalName}
                  onChange={(e) => setLegalName(e.target.value)}
                  placeholder="Acme Traders Private Limited"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Business Type</label>
                <p className="mb-2 text-xs text-slate-500">How this company is legally structured.</p>
                <div className="relative">
                  <select
                    value={businessType}
                    onChange={(e) => setBusinessType(e.target.value as BusinessType)}
                    className="w-full appearance-none rounded-lg border border-slate-200 py-2.5 pl-3.5 pr-10 text-sm text-slate-800 outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                  >
                    {BUSINESS_TYPE_LIST.map((t) => (
                      <option key={t} value={t}>
                        {BUSINESS_TYPES[t].label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200" />

        {/* Registration & Tax */}
        <div>
          <div className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-slate-900">
            <Landmark size={15} className="text-blue-500" />
            Registration &amp; Tax
          </div>
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              <div>
                <label className={labelClass}>Registration No.</label>
                <input
                  value={registrationNo}
                  onChange={(e) => setRegistrationNo(e.target.value)}
                  className={`${inputClass} mt-2`}
                />
              </div>
              <div>
                <label className={labelClass}>PAN No.</label>
                <input value={panNo} onChange={(e) => setPanNo(e.target.value)} className={`${inputClass} mt-2`} />
              </div>
              <div>
                <label className={labelClass}>VAT No.</label>
                <input value={vatNo} onChange={(e) => setVatNo(e.target.value)} className={`${inputClass} mt-2`} />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Tax Office</label>
                <p className="mb-2 text-xs text-slate-500">Ward / tax office jurisdiction.</p>
                <input
                  value={taxOfficeName}
                  onChange={(e) => setTaxOfficeName(e.target.value)}
                  placeholder="Inland Revenue Office, Kathmandu"
                  className={inputClass}
                />
              </div>
              <div className="flex items-end pb-2.5">
                <label className="flex items-center gap-2.5 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={isVatRegistered}
                    onChange={(e) => setIsVatRegistered(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand"
                  />
                  VAT registered
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200" />

        {/* Address */}
        <div>
          <div className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-slate-900">
            <MapPin size={15} className="text-blue-500" />
            Address
          </div>
          <div className="space-y-5">
            <div>
              <label className={labelClass}>Address</label>
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Street, building, area"
                className={`${inputClass} mt-2`}
              />
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
              <div>
                <label className={labelClass}>City</label>
                <input value={city} onChange={(e) => setCity(e.target.value)} className={`${inputClass} mt-2`} />
              </div>
              <div>
                <label className={labelClass}>District</label>
                <input
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className={`${inputClass} mt-2`}
                />
              </div>
              <div>
                <label className={labelClass}>Province</label>
                <input
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  className={`${inputClass} mt-2`}
                />
              </div>
              <div>
                <label className={labelClass}>Country</label>
                <input
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className={`${inputClass} mt-2`}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200" />

        {/* Contact */}
        <div>
          <div className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-slate-900">
            <Phone size={15} className="text-blue-500" />
            Contact
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <div>
              <label className={labelClass}>Phone</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} className={`${inputClass} mt-2`} />
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`${inputClass} mt-2`}
              />
            </div>
            <div>
              <label className={labelClass}>Website</label>
              <input value={website} onChange={(e) => setWebsite(e.target.value)} className={`${inputClass} mt-2`} />
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200" />

        {/* Preferences */}
        <div>
          <div className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-slate-900">
            <Building2 size={15} className="text-blue-500" />
            Preferences
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <div>
              <label className={labelClass}>Base Currency</label>
              <input
                value={baseCurrency}
                onChange={(e) => setBaseCurrency(e.target.value.toUpperCase())}
                maxLength={3}
                className={`${inputClass} mt-2 uppercase`}
              />
            </div>
            <div>
              <label className={labelClass}>Calendar</label>
              <div className="relative mt-2">
                <select
                  value={defaultCalendarPref}
                  onChange={(e) => setDefaultCalendarPref(e.target.value as CalendarPreference)}
                  className="w-full appearance-none rounded-lg border border-slate-200 py-2.5 pl-3.5 pr-10 text-sm text-slate-800 outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                >
                  {CALENDAR_PREFERENCE_LIST.map((c) => (
                    <option key={c} value={c}>
                      {CALENDAR_PREFERENCES[c].label}
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>
            <div>
              <label className={labelClass}>Status</label>
              <div className="relative mt-2">
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
          {!isEdit && (
            <p className="mt-3 text-xs text-slate-500">
              A &quot;Head Office&quot; branch is created automatically with this company.
            </p>
          )}
        </div>
      </div>

      <div className="my-6 border-t border-slate-200" />

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => router.push(isEdit ? `/setup/company/${initial!.id}` : "/setup/company")}
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
          {submitting ? "Saving..." : isEdit ? "Update Company" : "Save Company"}
        </button>
      </div>
    </form>
  );
}
