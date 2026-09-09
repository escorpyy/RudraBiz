"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Network, Save, MapPin, ShieldCheck } from "lucide-react";
import { ACCOUNT_TYPES, type AccountType, type RecordStatus } from "@/lib/constants";

type SubGroupOption = { id: number; code: string; description: string; isActive: boolean };
type AccountGroupOption = {
  id: number;
  code: string;
  description: string;
  type: AccountType;
  isActive: boolean;
  subGroups: SubGroupOption[];
};
type SubAreaOption = { id: number; code: string; name: string; areaName: string };
type AgentOption = { id: number; code: string; name: string };

// GLType restricted to the three values that make sense for a Party.
type PartyGLType = "CUSTOMER" | "VENDOR" | "BOTH";

export type PartyFormInitial = {
  id: number;
  code: string;
  name: string;
  accountGroupId: number;
  accountSubGroupId: number;
  glType: PartyGLType;
  status: RecordStatus;
  address: string;
  city: string;
  state: string;
  country: string;
  phone: string;
  mobile: string;
  email: string;
  contactPerson: string;
  panNo: string;
  isVatRegistered: boolean;
  subAreaId: number | null;
  agentId: number | null;
  creditLimit: string;
  creditDays: string;
  paymentTermDays: string;
};

export default function PartyForm({ initial }: { initial?: PartyFormInitial }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEdit = Boolean(initial);

  const [accountGroups, setAccountGroups] = useState<AccountGroupOption[]>([]);
  const [subAreas, setSubAreas] = useState<SubAreaOption[]>([]);
  const [agents, setAgents] = useState<AgentOption[]>([]);

  const [code, setCode] = useState(initial?.code ?? "");
  const [name, setName] = useState(initial?.name ?? "");
  const [accountGroupId, setAccountGroupId] = useState(initial ? String(initial.accountGroupId) : "");
  const [accountSubGroupId, setAccountSubGroupId] = useState(
    initial ? String(initial.accountSubGroupId) : ""
  );
  const [glType, setGlType] = useState<PartyGLType>(initial?.glType ?? "CUSTOMER");
  const [status, setStatus] = useState<RecordStatus>(initial?.status ?? "ACTIVE");

  const [address, setAddress] = useState(initial?.address ?? "");
  const [city, setCity] = useState(initial?.city ?? "");
  const [state, setState] = useState(initial?.state ?? "");
  const [country, setCountry] = useState(initial?.country ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [mobile, setMobile] = useState(initial?.mobile ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [contactPerson, setContactPerson] = useState(initial?.contactPerson ?? "");

  const [panNo, setPanNo] = useState(initial?.panNo ?? "");
  const [isVatRegistered, setIsVatRegistered] = useState(initial?.isVatRegistered ?? false);

  const [subAreaId, setSubAreaId] = useState(
    initial?.subAreaId ? String(initial.subAreaId) : searchParams.get("subAreaId") ?? ""
  );
  const [agentId, setAgentId] = useState(initial?.agentId ? String(initial.agentId) : "");

  const [creditLimit, setCreditLimit] = useState(initial?.creditLimit ?? "");
  const [creditDays, setCreditDays] = useState(initial?.creditDays ?? "");
  const [paymentTermDays, setPaymentTermDays] = useState(initial?.paymentTermDays ?? "");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/account-groups")
      .then((r) => r.json())
      .then((rows: AccountGroupOption[]) => setAccountGroups(rows))
      .catch(() => setAccountGroups([]));
    fetch("/api/sub-areas")
      .then((r) => r.json())
      .then((rows: SubAreaOption[]) => setSubAreas(rows))
      .catch(() => setSubAreas([]));
    fetch("/api/agents")
      .then((r) => r.json())
      .then((rows: AgentOption[]) => setAgents(rows))
      .catch(() => setAgents([]));
  }, []);

  const selectedGroup = accountGroups.find((g) => String(g.id) === accountGroupId);
  const availableSubGroups = useMemo(
    () => (selectedGroup ? selectedGroup.subGroups.filter((sg) => sg.isActive) : []),
    [selectedGroup]
  );

  const showCustomerFields = glType === "CUSTOMER" || glType === "BOTH";
  const showVendorFields = glType === "VENDOR" || glType === "BOTH";

  function handleGroupChange(value: string) {
    setAccountGroupId(value);
    setAccountSubGroupId("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!code.trim() || !name.trim() || !accountGroupId || !accountSubGroupId) {
      setError("Ledger Code, Ledger Name, Account Group, and Account Sub-Group are required.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(isEdit ? `/api/parties/${initial!.id}` : "/api/parties", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: code.trim(),
          name: name.trim(),
          accountSubGroupId: Number(accountSubGroupId),
          glType,
          isActive: status === "ACTIVE",
          address: address.trim(),
          city: city.trim(),
          state: state.trim(),
          country: country.trim(),
          phone: phone.trim(),
          mobile: mobile.trim(),
          email: email.trim(),
          contactPerson: contactPerson.trim(),
          panNo: panNo.trim(),
          isVatRegistered,
          subAreaId: subAreaId ? Number(subAreaId) : null,
          agentId: agentId ? Number(agentId) : null,
          creditLimit: showCustomerFields && creditLimit ? Number(creditLimit) : null,
          creditDays: showCustomerFields && creditDays ? Number(creditDays) : null,
          paymentTermDays: showVendorFields && paymentTermDays ? Number(paymentTermDays) : null,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to save party.");
      }

      router.push(isEdit ? `/master/parties/${initial!.id}` : "/master/parties");
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

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-6 shadow-card">
      <div>
        <h2 className="text-base font-semibold text-slate-900">Party Information</h2>
        <p className="mt-1 text-sm text-slate-500">
          {isEdit ? "Update this party's ledger and profile details." : "Create a customer or vendor party — this creates its underlying ledger too."}
        </p>
      </div>
      <div className="my-5 border-t border-slate-200" />

      {error && (
        <div className="mb-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {/* Ledger section */}
        <div>
          <div className="mb-3 text-sm font-semibold text-slate-900">Ledger</div>
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label className={labelClass}>
                  Ledger Code <span className="text-rose-500">*</span>
                </label>
                <p className={hintClass}>Unique code for this party's ledger account.</p>
                <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="PT-1000" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>
                  Party Name <span className="text-rose-500">*</span>
                </label>
                <p className={hintClass}>Name of the customer or vendor.</p>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="ABC Traders Pvt. Ltd." className={inputClass} />
              </div>
            </div>

            <div>
              <label className={labelClass}>
                Party Type <span className="text-rose-500">*</span>
              </label>
              <p className={hintClass}>Determines which detail fields (credit / payment terms) apply.</p>
              <div className="relative max-w-xs">
                <select
                  value={glType}
                  onChange={(e) => setGlType(e.target.value as PartyGLType)}
                  className="w-full appearance-none rounded-lg border border-slate-200 py-2.5 pl-3.5 pr-10 text-sm text-slate-800 outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                >
                  <option value="CUSTOMER">Customer</option>
                  <option value="VENDOR">Vendor</option>
                  <option value="BOTH">Both (Customer &amp; Vendor)</option>
                </select>
                <ChevronDown size={16} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            <div>
              <label className={labelClass}>
                Account Group <span className="text-rose-500">*</span>
              </label>
              <p className={hintClass}>Select the account group this party's ledger belongs to.</p>
              <div className="relative">
                <Network size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-500" />
                <select
                  value={accountGroupId}
                  onChange={(e) => handleGroupChange(e.target.value)}
                  className="w-full appearance-none rounded-lg border border-slate-200 py-2.5 pl-10 pr-10 text-sm text-slate-800 outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                >
                  <option value="">
                    {accountGroups.length === 0 ? "No account groups available — create one first" : "Select an account group"}
                  </option>
                  {accountGroups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.code} — {g.description} ({ACCOUNT_TYPES[g.type].label})
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            <div>
              <label className={labelClass}>
                Account Sub-Group <span className="text-rose-500">*</span>
              </label>
              <p className={hintClass}>
                {accountGroupId ? "Usually Accounts Receivable (customer) or Accounts Payable (vendor)." : "Select an Account Group first."}
              </p>
              <div className="relative">
                <select
                  value={accountSubGroupId}
                  onChange={(e) => setAccountSubGroupId(e.target.value)}
                  disabled={!accountGroupId}
                  className="w-full appearance-none rounded-lg border border-slate-200 py-2.5 pl-3.5 pr-10 text-sm text-slate-800 outline-none focus:border-brand focus:ring-1 focus:ring-brand disabled:bg-slate-50 disabled:text-slate-400"
                >
                  <option value="">
                    {!accountGroupId
                      ? "Select an Account Group first"
                      : availableSubGroups.length === 0
                        ? "No sub-groups in this group — create one first"
                        : "Select a sub-group"}
                  </option>
                  {availableSubGroups.map((sg) => (
                    <option key={sg.id} value={sg.id}>
                      {sg.code} — {sg.description}
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200" />

        {/* Contact section */}
        <div>
          <div className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-slate-900">
            <MapPin size={15} className="text-blue-500" />
            Contact Information
          </div>
          <div className="space-y-5">
            <div>
              <label className={labelClass}>Address</label>
              <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street, building, area" className={`${inputClass} mt-2`} />
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              <div>
                <label className={labelClass}>City</label>
                <input value={city} onChange={(e) => setCity(e.target.value)} className={`${inputClass} mt-2`} />
              </div>
              <div>
                <label className={labelClass}>State</label>
                <input value={state} onChange={(e) => setState(e.target.value)} className={`${inputClass} mt-2`} />
              </div>
              <div>
                <label className={labelClass}>Country</label>
                <input value={country} onChange={(e) => setCountry(e.target.value)} className={`${inputClass} mt-2`} />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Phone</label>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} className={`${inputClass} mt-2`} />
              </div>
              <div>
                <label className={labelClass}>Mobile</label>
                <input value={mobile} onChange={(e) => setMobile(e.target.value)} className={`${inputClass} mt-2`} />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={`${inputClass} mt-2`} />
              </div>
              <div>
                <label className={labelClass}>Contact Person</label>
                <input value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} className={`${inputClass} mt-2`} />
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200" />

        {/* Tax & compliance */}
        <div>
          <div className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-slate-900">
            <ShieldCheck size={15} className="text-blue-500" />
            Tax &amp; Compliance
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label className={labelClass}>PAN Number</label>
              <p className={hintClass}>Unique tax identification number.</p>
              <input value={panNo} onChange={(e) => setPanNo(e.target.value)} className={inputClass} />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2.5 rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={isVatRegistered}
                  onChange={(e) => setIsVatRegistered(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand"
                />
                VAT Registered
              </label>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200" />

        {/* Area & agent */}
        <div>
          <div className="mb-3 text-sm font-semibold text-slate-900">Area &amp; Agent</div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Sub-Area</label>
              <p className={hintClass}>Optional — region this party is based in.</p>
              <div className="relative">
                <select
                  value={subAreaId}
                  onChange={(e) => setSubAreaId(e.target.value)}
                  className="w-full appearance-none rounded-lg border border-slate-200 py-2.5 pl-3.5 pr-10 text-sm text-slate-800 outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                >
                  <option value="">{subAreas.length === 0 ? "No sub-areas available" : "None"}</option>
                  {subAreas.map((sa) => (
                    <option key={sa.id} value={sa.id}>
                      {sa.areaName} — {sa.name}
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>
            <div>
              <label className={labelClass}>Agent</label>
              <p className={hintClass}>Optional — sales/purchase agent linked to this party.</p>
              <div className="relative">
                <select
                  value={agentId}
                  onChange={(e) => setAgentId(e.target.value)}
                  className="w-full appearance-none rounded-lg border border-slate-200 py-2.5 pl-3.5 pr-10 text-sm text-slate-800 outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                >
                  <option value="">{agents.length === 0 ? "No agents available" : "None"}</option>
                  {agents.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.code} — {a.name}
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Customer terms */}
        {showCustomerFields && (
          <>
            <div className="border-t border-slate-200" />
            <div>
              <div className="mb-3 text-sm font-semibold text-slate-900">Customer Terms</div>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Credit Limit</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={creditLimit}
                    onChange={(e) => setCreditLimit(e.target.value)}
                    placeholder="0.00"
                    className={`${inputClass} mt-2`}
                  />
                </div>
                <div>
                  <label className={labelClass}>Credit Days</label>
                  <input
                    type="number"
                    min="0"
                    value={creditDays}
                    onChange={(e) => setCreditDays(e.target.value)}
                    placeholder="30"
                    className={`${inputClass} mt-2`}
                  />
                </div>
              </div>
            </div>
          </>
        )}

        {/* Vendor terms */}
        {showVendorFields && (
          <>
            <div className="border-t border-slate-200" />
            <div>
              <div className="mb-3 text-sm font-semibold text-slate-900">Vendor Terms</div>
              <div className="max-w-xs">
                <label className={labelClass}>Payment Term Days</label>
                <input
                  type="number"
                  min="0"
                  value={paymentTermDays}
                  onChange={(e) => setPaymentTermDays(e.target.value)}
                  placeholder="30"
                  className={`${inputClass} mt-2`}
                />
              </div>
            </div>
          </>
        )}

        <div className="border-t border-slate-200" />

        {/* Status */}
        <div>
          <label className={labelClass}>Status</label>
          <p className={hintClass}>Set active to make this party available for postings.</p>
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
          onClick={() => router.push(isEdit ? `/master/parties/${initial!.id}` : "/master/parties")}
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
          {submitting ? "Saving..." : isEdit ? "Update Party" : "Save Party"}
        </button>
      </div>
    </form>
  );
}
