import { Route, Routes } from "react-router";
import AppShell from "./components/layout/AppShell";
import RequireAuth from "./components/RequireAuth";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import NotMigrated from "./pages/NotMigrated";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<RequireAuth />}>
        <Route element={<AppShell />}>
          <Route index element={<HomePage />} />
          {/* Migrated modules are added here, one per patch. */}
          <Route path="*" element={<NotMigrated />} />
        </Route>
      </Route>
    </Routes>
  );
}
