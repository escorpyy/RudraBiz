import { useMe } from "../lib/me";

export default function HomePage() {
  const { data: me } = useMe();
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Welcome{me ? `, ${me.user.name}` : ""}</h1>
      <p className="mt-1 text-sm text-slate-500">Pick a module from the sidebar.</p>
    </div>
  );
}
