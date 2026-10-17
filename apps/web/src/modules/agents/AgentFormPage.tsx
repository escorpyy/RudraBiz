import { ArrowLeft } from "lucide-react";
import { Link, Navigate, useParams } from "react-router";
import { useCanWrite } from "../../lib/useCanWrite";
import AgentForm from "./AgentForm";
import AgentInfoPanel from "./AgentInfoPanel";
import { useAgent } from "./queries";

export default function AgentFormPage() {
  const params = useParams();
  const id = params.id ? Number(params.id) : undefined;
  const canWrite = useCanWrite();
  const { data: agent, isLoading, error } = useAgent(id);

  if (!canWrite) return <Navigate to={id ? `/master/agents/${id}` : "/master/agents"} replace />;

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{id ? "Edit Agent" : "New Agent"}</h1>
          <div className="mt-1 flex items-center gap-1.5 text-sm">
            <Link to="/master/agents" className="text-brand hover:underline">Agent Master</Link>
            <span className="text-slate-400">&gt;</span>
            <span className="text-slate-500">{id ? (agent?.code ?? "...") : "New"}</span>
          </div>
        </div>
        <Link to={id ? `/master/agents/${id}` : "/master/agents"} className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
          <ArrowLeft size={16} /> Back
        </Link>
      </div>
      <div className="my-5 border-t border-slate-200" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
        {id && isLoading ? (
          <div className="text-sm text-slate-500">Loading...</div>
        ) : id && error ? (
          <div className="text-sm text-rose-600">Agent not found.</div>
        ) : (
          <AgentForm key={agent?.id ?? "new"} initial={agent} />
        )}
        <AgentInfoPanel />
      </div>
    </div>
  );
}
