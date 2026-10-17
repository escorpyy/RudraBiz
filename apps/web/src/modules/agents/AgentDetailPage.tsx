import { ArrowLeft, BookOpen, Pencil, Trash2, Users } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import ConfirmDialog from "../../components/shared/ConfirmDialog";
import StatusBadge from "../../components/shared/StatusBadge";
import { ApiError } from "../../lib/api";
import { useCanWrite } from "../../lib/useCanWrite";
import { useAgent, useDeleteAgent } from "./queries";

export default function AgentDetailPage() {
  const id = Number(useParams().id);
  const navigate = useNavigate();
  const canWrite = useCanWrite();
  const { data: agent, isLoading, error } = useAgent(id);
  const del = useDeleteAgent();
  const [confirm, setConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  if (isLoading) return <div className="text-sm text-slate-500">Loading...</div>;
  if (error || !agent) {
    return (
      <div className="text-sm text-rose-600">
        {error instanceof ApiError && error.status === 404 ? "Agent not found." : "Could not load this agent."}{" "}
        <Link to="/master/agents" className="text-brand hover:underline">Back to Agent Master</Link>
      </div>
    );
  }

  async function onDelete() {
    setDeleteError(null);
    try {
      await del.mutateAsync(agent!.id);
      navigate("/master/agents");
    } catch (e) {
      setDeleteError(e instanceof ApiError ? e.message : "Failed to delete agent.");
    }
  }

  const th = "px-3 py-3 font-medium";
  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">{agent.name}</h1>
            <StatusBadge status={agent.isActive ? "ACTIVE" : "INACTIVE"} />
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-sm">
            <Link to="/master/agents" className="text-brand hover:underline">Agent Master</Link>
            <span className="text-slate-400">&gt;</span>
            <span className="text-slate-500">{agent.code}</span>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <Link to="/master/agents" className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
            <ArrowLeft size={16} /> Back
          </Link>
          {canWrite && (
            <>
              <Link to={`/master/agents/${agent.id}/edit`} className="flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-hover">
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
          <div className="text-sm text-slate-500">Agent Code</div>
          <div className="mt-1 text-lg font-semibold text-slate-900">{agent.code}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
          <div className="text-sm text-slate-500">Phone</div>
          <div className="mt-1 text-lg font-semibold text-slate-900">{agent.phone || "—"}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
          <div className="text-sm text-slate-500">Ledgers / Parties Tagged</div>
          <div className="mt-1 text-lg font-semibold text-slate-900">
            {agent.ledgersCount} / {agent.partiesCount}
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white shadow-card">
        <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-4">
          <BookOpen size={16} className="text-blue-500" />
          <h2 className="text-base font-semibold text-slate-900">Ledgers Tagged to this Agent</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-medium uppercase tracking-wide text-slate-500">
                <th className="px-5 py-3 font-medium">Code</th>
                <th className={th}>Name</th>
                <th className={th}>Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {agent.ledgers.map((gl) => (
                <tr key={gl.id} className="hover:bg-slate-50/60">
                  <td className="px-5 py-3.5 font-medium text-slate-900">{gl.code}</td>
                  <td className="px-3 py-3.5 text-slate-800">{gl.name}</td>
                  <td className="px-3 py-3.5"><StatusBadge status={gl.isActive ? "ACTIVE" : "INACTIVE"} /></td>
                </tr>
              ))}
              {agent.ledgers.length === 0 && (
                <tr><td colSpan={3} className="px-5 py-10 text-center text-sm text-slate-400">No ledgers tagged to this agent yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white shadow-card">
        <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-4">
          <Users size={16} className="text-violet-500" />
          <h2 className="text-base font-semibold text-slate-900">Parties Tagged to this Agent</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-medium uppercase tracking-wide text-slate-500">
                <th className="px-5 py-3 font-medium">Code</th>
                <th className={th}>Name</th>
                <th className="px-5 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {agent.parties.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/60">
                  <td className="px-5 py-3.5 font-medium text-slate-900">{p.code}</td>
                  <td className="px-3 py-3.5 text-slate-800">{p.name}</td>
                  <td className="px-5 py-3.5 text-right">
                    <Link to={`/master/parties/${p.id}`} className="text-sm font-medium text-brand hover:underline">View</Link>
                  </td>
                </tr>
              ))}
              {agent.parties.length === 0 && (
                <tr><td colSpan={3} className="px-5 py-10 text-center text-sm text-slate-400">No parties tagged to this agent yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog
        open={confirm}
        title={`Delete "${agent.name}"?`}
        message="This permanently deletes the agent and unlinks it from any ledgers, parties, or vouchers it was tagged on. This can't be undone."
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
