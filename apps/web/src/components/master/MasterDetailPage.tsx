import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { ApiError } from "../../lib/api";
import { useRowAccess } from "../../lib/useWriteAccess";
import ConfirmDialog from "../shared/ConfirmDialog";
import StatusBadge from "../shared/StatusBadge";
import { useMasterDelete, useMasterOne } from "./masterApi";
import type { MasterConfig, MasterRow } from "./types";

/** Detail page: header with edit/delete, summary cards from cfg.summary, then cfg.detailExtra. */
export default function MasterDetailPage<Row extends MasterRow, Detail extends Row>({ cfg }: { cfg: MasterConfig<Row, Detail> }) {
  const id = Number(useParams().id);
  const navigate = useNavigate();
  const rowAccess = useRowAccess(cfg);
  const { data: row, isLoading, error } = useMasterOne<Detail>(cfg, id);
  const del = useMasterDelete(cfg);
  const [confirm, setConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  if (isLoading) return <div className="text-sm text-slate-500">Loading...</div>;
  if (error || !row) {
    return (
      <div className="text-sm text-rose-600">
        {error instanceof ApiError && error.status === 404 ? `${cfg.singular} not found.` : `Could not load this ${cfg.singular.toLowerCase()}.`}{" "}
        <Link to={cfg.basePath} className="text-brand hover:underline">Back to {cfg.title}</Link>
      </div>
    );
  }
  const current = row;

  async function onDelete() {
    setDeleteError(null);
    try {
      await del.mutateAsync(current.id);
      navigate(cfg.basePath);
    } catch (e) {
      setDeleteError(e instanceof ApiError ? e.message : `Failed to delete ${cfg.singular.toLowerCase()}.`);
    }
  }

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">{cfg.nameOf(current)}</h1>
            <StatusBadge status={current.isActive ? "ACTIVE" : "INACTIVE"} />
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-sm">
            <Link to={cfg.basePath} className="text-brand hover:underline">{cfg.title}</Link>
            <span className="text-slate-400">&gt;</span>
            <span className="text-slate-500">{cfg.codeOf(current)}</span>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <Link to={cfg.basePath} className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
            <ArrowLeft size={16} /> Back
          </Link>
          {rowAccess(current) && (
            <>
              <Link to={`${cfg.basePath}/${current.id}/edit`} className="flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-hover">
                <Pencil size={16} /> Edit
              </Link>
              <button type="button" onClick={() => setConfirm(true)} className="flex items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-4 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50">
                <Trash2 size={16} /> Delete
              </button>
            </>
          )}
        </div>
      </div>
      <div className="my-5 border-t border-slate-200" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
        {cfg.summary.map((s) => (
          <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
            <div className="text-sm text-slate-500">{s.label}</div>
            <div className="mt-1 text-lg font-semibold text-slate-900">{s.value(current)}</div>
          </div>
        ))}
      </div>
      {cfg.detailExtra?.(current)}
      <ConfirmDialog
        open={confirm}
        title={`Delete "${cfg.nameOf(current)}"?`}
        message={cfg.deleteMessage}
        error={deleteError}
        loading={del.isPending}
        onConfirm={onDelete}
        onCancel={() => {
          setConfirm(false);
          setDeleteError(null);
        }}
      />
    </div>
  );
}
