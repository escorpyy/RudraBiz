import { ArrowLeft } from "lucide-react";
import { Link, Navigate, useParams } from "react-router";
import { useCanWrite } from "../../lib/useCanWrite";
import MasterForm from "./MasterForm";
import { useMasterOne } from "./masterApi";
import type { MasterConfig, MasterRow } from "./types";

/** New / edit page. Viewers are sent back to the list (the server refuses their writes too). */
export default function MasterFormPage<Row extends MasterRow>({ cfg }: { cfg: MasterConfig<Row> }) {
  const params = useParams();
  const id = params.id ? Number(params.id) : undefined;
  const canWrite = useCanWrite();
  const { data: row, isLoading, error } = useMasterOne<Row>(cfg, id);
  const back = id ? `${cfg.basePath}/${id}` : cfg.basePath;

  if (!canWrite) return <Navigate to={back} replace />;

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{id ? `Edit ${cfg.singular}` : `New ${cfg.singular}`}</h1>
          <div className="mt-1 flex items-center gap-1.5 text-sm">
            <Link to={cfg.basePath} className="text-brand hover:underline">{cfg.title}</Link>
            <span className="text-slate-400">&gt;</span>
            <span className="text-slate-500">{id ? (row ? cfg.codeOf(row) : "...") : "New"}</span>
          </div>
        </div>
        <Link to={back} className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
          <ArrowLeft size={16} /> Back
        </Link>
      </div>
      <div className="my-5 border-t border-slate-200" />
      <div className={cfg.infoPanel ? "grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]" : "max-w-3xl"}>
        {id && isLoading ? (
          <div className="text-sm text-slate-500">Loading...</div>
        ) : id && error ? (
          <div className="text-sm text-rose-600">{cfg.singular} not found.</div>
        ) : (
          <MasterForm key={row?.id ?? "new"} cfg={cfg} initial={row} />
        )}
        {cfg.infoPanel}
      </div>
    </div>
  );
}
