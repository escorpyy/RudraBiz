import { Outlet } from "react-router";
import CompanySwitcher from "./CompanySwitcher";
import Sidebar from "./Sidebar";

export default function AppShell() {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <CompanySwitcher />
        <main className="min-w-0 flex-1 px-8 py-7">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
