import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronDown, IdCard, Phone, Save } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { agentInputSchema, type AgentInput, type AgentRow } from "@ntcas/shared";
import { ApiError } from "../../lib/api";
import { useSaveAgent } from "./queries";

const inputCls = "w-full rounded-lg border border-slate-200 py-2.5 pr-3.5 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand";

export default function AgentForm({ initial }: { initial?: AgentRow }) {
  const navigate = useNavigate();
  const isEdit = Boolean(initial);
  const save = useSaveAgent(initial?.id);
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    watch,
    formState: { errors },
  } = useForm<AgentInput>({
    resolver: zodResolver(agentInputSchema),
    defaultValues: {
      code: initial?.code ?? "",
      name: initial?.name ?? "",
      phone: initial?.phone ?? "",
      isActive: initial?.isActive ?? true,
    },
  });
  const isActive = watch("isActive");
  const backTo = isEdit ? `/master/agents/${initial!.id}` : "/master/agents";

  async function onSubmit(values: AgentInput) {
    setFormError(null);
    try {
      const saved = await save.mutateAsync(values);
      navigate(isEdit ? `/master/agents/${initial!.id}` : `/master/agents/${saved.id}`);
    } catch (e) {
      if (!(e instanceof ApiError)) return setFormError("Something went wrong.");
      const fields = Object.entries(e.fieldErrors);
      if (e.status === 400 && fields.length) {
        for (const [name, msgs] of fields) setError(name as keyof AgentInput, { message: msgs[0] });
      } else if (e.status === 409) {
        setError("code", { message: e.message });
      } else {
        setFormError(e.message);
      }
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="rounded-xl border border-slate-200 bg-white p-6 shadow-card">
      <div>
        <h2 className="text-base font-semibold text-slate-900">Agent Information</h2>
        <p className="mt-1 text-sm text-slate-500">{isEdit ? "Update details of this agent." : "Provide details of the new agent."}</p>
      </div>
      <div className="my-5 border-t border-slate-200" />

      {formError && <div className="mb-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-700">{formError}</div>}

      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="code" className="text-sm font-medium text-slate-800">
              Agent Code <span className="text-rose-500">*</span>
            </label>
            <p className="mb-2 text-xs text-slate-500">Unique code for this agent.</p>
            <div className="relative">
              <IdCard size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-500" />
              <input id="code" placeholder="AG-001" className={`${inputCls} pl-10`} {...register("code")} />
            </div>
            {errors.code && <p className="mt-1 text-xs text-rose-600">{errors.code.message}</p>}
          </div>
          <div>
            <label htmlFor="name" className="text-sm font-medium text-slate-800">
              Agent Name <span className="text-rose-500">*</span>
            </label>
            <p className="mb-2 text-xs text-slate-500">Full name of the agent or broker.</p>
            <input id="name" placeholder="Ram Kumar Sharma" className={`${inputCls} pl-3.5`} {...register("name")} />
            {errors.name && <p className="mt-1 text-xs text-rose-600">{errors.name.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="phone" className="text-sm font-medium text-slate-800">Phone</label>
            <p className="mb-2 text-xs text-slate-500">Optional contact number for this agent.</p>
            <div className="relative">
              <Phone size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-500" />
              <input id="phone" placeholder="98XXXXXXXX" className={`${inputCls} pl-10`} {...register("phone")} />
            </div>
            {errors.phone && <p className="mt-1 text-xs text-rose-600">{errors.phone.message}</p>}
          </div>
          <div>
            <label htmlFor="status" className="text-sm font-medium text-slate-800">Status</label>
            <p className="mb-2 text-xs text-slate-500">Set active to make this agent selectable.</p>
            <div className="relative">
              <span className={`pointer-events-none absolute left-3.5 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full ${isActive ? "bg-emerald-500" : "bg-slate-400"}`} />
              <select
                id="status"
                className="w-full appearance-none rounded-lg border border-slate-200 py-2.5 pl-8 pr-10 text-sm text-slate-800 outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                {...register("isActive", { setValueAs: (v) => v === true || v === "true" })}
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
              <ChevronDown size={16} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="my-6 border-t border-slate-200" />
      <div className="flex justify-end gap-3">
        <button type="button" onClick={() => navigate(backTo)} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
          Cancel
        </button>
        <button type="submit" disabled={save.isPending} className="flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-hover disabled:opacity-60">
          <Save size={16} />
          {save.isPending ? "Saving..." : isEdit ? "Update Agent" : "Save Agent"}
        </button>
      </div>
    </form>
  );
}
