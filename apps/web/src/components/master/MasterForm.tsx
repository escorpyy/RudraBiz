import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronDown, Save } from "lucide-react";
import { useState } from "react";
import { useForm, type FieldValues } from "react-hook-form";
import { useNavigate } from "react-router";
import { ApiError } from "../../lib/api";
import { useMasterSave } from "./masterApi";
import type { FieldDef, MasterConfig, MasterRow } from "./types";

const inputCls = "w-full rounded-lg border border-slate-200 py-2.5 pr-3.5 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand";

function defaultsFor<Row extends MasterRow>(cfg: MasterConfig<Row>, initial?: Row) {
  const v: Record<string, unknown> = {};
  for (const f of cfg.fields) {
    if (f.kind === "status") v.isActive = initial?.isActive ?? true;
    else v[f.name] = (initial as unknown as Record<string, unknown> | undefined)?.[f.name] ?? "";
  }
  return v;
}

/** Create/edit form for any master, built from cfg.fields and validated by the shared Zod schema. */
export default function MasterForm<Row extends MasterRow>({ cfg, initial }: { cfg: MasterConfig<Row>; initial?: Row }) {
  const navigate = useNavigate();
  const isEdit = Boolean(initial);
  const save = useMasterSave<Row>(cfg, initial?.id);
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    watch,
    formState: { errors },
  } = useForm<FieldValues>({ resolver: zodResolver(cfg.schema), defaultValues: defaultsFor(cfg, initial) });
  const isActive = watch("isActive");
  const backTo = isEdit ? `${cfg.basePath}/${initial!.id}` : cfg.basePath;
  const lower = cfg.singular.toLowerCase();

  async function onSubmit(values: FieldValues) {
    setFormError(null);
    try {
      const saved = await save.mutateAsync(values);
      navigate(isEdit ? backTo : `${cfg.basePath}/${saved.id}`);
    } catch (e) {
      if (!(e instanceof ApiError)) return setFormError("Something went wrong.");
      const fields = Object.entries(e.fieldErrors);
      const conflictField = (e.details as { field?: string } | undefined)?.field;
      if (e.status === 400 && fields.length) {
        for (const [name, msgs] of fields) setError(name, { message: msgs[0] });
      } else if (e.status === 409 && conflictField) {
        setError(conflictField, { message: e.message });
      } else {
        setFormError(e.message);
      }
    }
  }

  function renderField(f: FieldDef) {
    if (f.kind === "status") {
      return (
        <div key="status">
          <label htmlFor="isActive" className="text-sm font-medium text-slate-800">{f.label}</label>
          <p className="mb-2 text-xs text-slate-500">{f.hint}</p>
          <div className="relative">
            <span className={`pointer-events-none absolute left-3.5 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full ${isActive ? "bg-emerald-500" : "bg-slate-400"}`} />
            <select
              id="isActive"
              className="w-full appearance-none rounded-lg border border-slate-200 py-2.5 pl-8 pr-10 text-sm text-slate-800 outline-none focus:border-brand focus:ring-1 focus:ring-brand"
              {...register("isActive", { setValueAs: (v) => v === true || v === "true" })}
            >
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
            <ChevronDown size={16} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>
        </div>
      );
    }
    const Icon = f.icon;
    const err = errors[f.name]?.message as string | undefined;
    return (
      <div key={f.name}>
        <label htmlFor={f.name} className="text-sm font-medium text-slate-800">
          {f.label} {f.required && <span className="text-rose-500">*</span>}
        </label>
        <p className="mb-2 text-xs text-slate-500">{f.hint}</p>
        <div className="relative">
          {Icon && <Icon size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-500" />}
          <input id={f.name} placeholder={f.placeholder} className={`${inputCls} ${Icon ? "pl-10" : "pl-3.5"}`} {...register(f.name)} />
        </div>
        {err && <p className="mt-1 text-xs text-rose-600">{err}</p>}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="rounded-xl border border-slate-200 bg-white p-6 shadow-card">
      <div>
        <h2 className="text-base font-semibold text-slate-900">{cfg.singular} Information</h2>
        <p className="mt-1 text-sm text-slate-500">{isEdit ? `Update details of this ${lower}.` : `Provide details of the new ${lower}.`}</p>
      </div>
      <div className="my-5 border-t border-slate-200" />
      {formError && <div className="mb-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-700">{formError}</div>}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">{cfg.fields.map(renderField)}</div>
      <div className="my-6 border-t border-slate-200" />
      <div className="flex justify-end gap-3">
        <button type="button" onClick={() => navigate(backTo)} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
        <button type="submit" disabled={save.isPending} className="flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-hover disabled:opacity-60">
          <Save size={16} />
          {save.isPending ? "Saving..." : isEdit ? `Update ${cfg.singular}` : `Save ${cfg.singular}`}
        </button>
      </div>
    </form>
  );
}
