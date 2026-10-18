import { Route, Routes } from "react-router";
import AppShell from "./components/layout/AppShell";
import RequireAuth from "./components/RequireAuth";
import { masterRoutes } from "./components/master/masterRoutes";
import { agentsConfig } from "./modules/agents/config";
import { stockCategoriesConfig } from "./modules/stockCategories/config";
import { areasConfig } from "./modules/areas/config";
import { productGroupsConfig } from "./modules/productGroups/config";
import { taxRatesConfig } from "./modules/taxRates/config";
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
          {masterRoutes(agentsConfig)}
          {masterRoutes(stockCategoriesConfig)}
          {masterRoutes(taxRatesConfig)}
          {masterRoutes(productGroupsConfig)}
          {masterRoutes(areasConfig)}
          <Route path="*" element={<NotMigrated />} />
        </Route>
      </Route>
    </Routes>
  );
}
