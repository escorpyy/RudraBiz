import { useLocation } from "react-router";

export default function NotMigrated() {
  const { pathname } = useLocation();
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
      <div className="text-lg font-semibold text-slate-800">Not migrated yet</div>
      <p className="mt-1 text-sm text-slate-500">
        <code className="rounded bg-slate-100 px-1.5 py-0.5">{pathname}</code> is still only in the legacy app.
      </p>
    </div>
  );
}
