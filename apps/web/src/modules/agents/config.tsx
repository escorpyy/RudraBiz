import { BookOpen, IdCard, Phone, Users } from "lucide-react";
import { Link } from "react-router";
import { agentInputSchema, type AgentDetail, type AgentRow } from "@ntcas/shared";
import StatusBadge from "../../components/shared/StatusBadge";
import type { MasterConfig } from "../../components/master/types";
import AgentInfoPanel from "./AgentInfoPanel";

const th = "px-3 py-3 font-medium";
const headRow = "border-b border-slate-200 text-xs font-medium uppercase tracking-wide text-slate-500";

export const agentsConfig: MasterConfig<AgentRow, AgentDetail> = {
  key: "agents",
  apiPath: "/api/agents",
  basePath: "/master/agents",
  singular: "Agent",
  title: "Agent Master",
  subtitle: "Manage agents/brokers used to tag ledgers, parties, and vouchers",
  newLabel: "New Agent",
  nameOf: (a) => a.name,
  codeOf: (a) => a.code,

  stats: (rows) => [
    { icon: IdCard, iconBg: "bg-blue-100", iconColor: "text-blue-600", label: "Agents", value: rows.length, caption: "Total agents" },
    { icon: IdCard, iconBg: "bg-emerald-100", iconColor: "text-emerald-600", label: "Active", value: rows.filter((a) => a.isActive).length, caption: "Currently selectable" },
    { icon: BookOpen, iconBg: "bg-amber-100", iconColor: "text-amber-600", label: "Ledgers", value: rows.reduce((s, a) => s + a.ledgersCount, 0), caption: "Ledgers tagged to an agent" },
    { icon: Users, iconBg: "bg-violet-100", iconColor: "text-violet-600", label: "Parties", value: rows.reduce((s, a) => s + a.partiesCount, 0), caption: "Parties tagged to an agent" },
  ],
  columns: [
    { header: "Agent Code", cell: (a) => a.code, className: "font-medium text-slate-900" },
    { header: "Agent Name", cell: (a) => a.name },
    { header: "Phone", cell: (a) => a.phone || "—", className: "text-slate-500" },
    { header: "Ledgers", cell: (a) => <span className="font-medium text-brand">{a.ledgersCount}</span> },
    { header: "Parties", cell: (a) => <span className="font-medium text-brand">{a.partiesCount}</span> },
  ],
  searchText: (a) => [a.code, a.name, a.phone ?? ""],
  deleteMessage: "This permanently deletes the agent and unlinks it from any ledgers, parties, or vouchers it was tagged on. This can't be undone.",

  schema: agentInputSchema,
  fields: [
    { kind: "text", name: "code", label: "Agent Code", hint: "Unique code for this agent.", placeholder: "AG-001", icon: IdCard, required: true },
    { kind: "text", name: "name", label: "Agent Name", hint: "Full name of the agent or broker.", placeholder: "Ram Kumar Sharma", required: true },
    { kind: "text", name: "phone", label: "Phone", hint: "Optional contact number for this agent.", placeholder: "98XXXXXXXX", icon: Phone },
    { kind: "status", label: "Status", hint: "Set active to make this agent selectable." },
  ],
  infoPanel: <AgentInfoPanel />,

  summary: [
    { label: "Agent Code", value: (a) => a.code },
    { label: "Phone", value: (a) => a.phone || "—" },
    { label: "Ledgers / Parties Tagged", value: (a) => `${a.ledgersCount} / ${a.partiesCount}` },
  ],
  detailExtra: (a) => (
    <>
      <div className="mt-6 rounded-xl border border-slate-200 bg-white shadow-card">
        <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-4">
          <BookOpen size={16} className="text-blue-500" />
          <h2 className="text-base font-semibold text-slate-900">Ledgers Tagged to this Agent</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className={headRow}>
                <th className="px-5 py-3 font-medium">Code</th>
                <th className={th}>Name</th>
                <th className={th}>Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {a.ledgers.map((gl) => (
                <tr key={gl.id} className="hover:bg-slate-50/60">
                  <td className="px-5 py-3.5 font-medium text-slate-900">{gl.code}</td>
                  <td className="px-3 py-3.5 text-slate-800">{gl.name}</td>
                  <td className="px-3 py-3.5"><StatusBadge status={gl.isActive ? "ACTIVE" : "INACTIVE"} /></td>
                </tr>
              ))}
              {a.ledgers.length === 0 && <tr><td colSpan={3} className="px-5 py-10 text-center text-sm text-slate-400">No ledgers tagged to this agent yet.</td></tr>}
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
              <tr className={headRow}>
                <th className="px-5 py-3 font-medium">Code</th>
                <th className={th}>Name</th>
                <th className="px-5 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {a.parties.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/60">
                  <td className="px-5 py-3.5 font-medium text-slate-900">{p.code}</td>
                  <td className="px-3 py-3.5 text-slate-800">{p.name}</td>
                  <td className="px-5 py-3.5 text-right"><Link to={`/master/parties/${p.id}`} className="text-sm font-medium text-brand hover:underline">View</Link></td>
                </tr>
              ))}
              {a.parties.length === 0 && <tr><td colSpan={3} className="px-5 py-10 text-center text-sm text-slate-400">No parties tagged to this agent yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </>
  ),
};
