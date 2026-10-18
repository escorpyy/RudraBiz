import { Route } from "react-router";
import MasterDetailPage from "./MasterDetailPage";
import MasterFormPage from "./MasterFormPage";
import MasterListPage from "./MasterListPage";
import type { MasterConfig, MasterRow } from "./types";

/** The four routes of a master (list, new, detail, edit), relative to the app shell. */
export function masterRoutes<Row extends MasterRow, Detail extends Row>(cfg: MasterConfig<Row, Detail>) {
  const base = cfg.basePath.replace(/^\//, "");
  return [
    <Route key={`${base}-list`} path={base} element={<MasterListPage cfg={cfg as unknown as MasterConfig<Row>} />} />,
    <Route key={`${base}-new`} path={`${base}/new`} element={<MasterFormPage cfg={cfg as unknown as MasterConfig<Row>} />} />,
    <Route key={`${base}-detail`} path={`${base}/:id`} element={<MasterDetailPage cfg={cfg} />} />,
    <Route key={`${base}-edit`} path={`${base}/:id/edit`} element={<MasterFormPage cfg={cfg as unknown as MasterConfig<Row>} />} />,
  ];
}
