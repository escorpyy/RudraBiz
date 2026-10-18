import express from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import type { Auth } from "./auth/auth";
import { companyContext } from "./auth/companyContext";
import { requireAuth } from "./auth/session";
import type { Db } from "./db/client";
import { errorHandler, notFoundHandler } from "./http/errorHandler";
import { agentsRouter } from "./modules/agents/agents.router";
import { locationsRouter } from "./modules/locations/locations.router";
import { unitsRouter } from "./modules/units/units.router";
import { areasRouter } from "./modules/areas/areas.router";
import { productGroupsRouter } from "./modules/productGroups/productGroups.router";
import { taxRatesRouter } from "./modules/taxRates/taxRates.router";
import { stockCategoriesRouter } from "./modules/stockCategories/stockCategories.router";
import { meRouter } from "./routes/me";

export interface AppDeps {
  webOrigin: string;
  db: Db;
  auth: Auth;
}

export function createApp({ webOrigin, db, auth }: AppDeps) {
  const app = express();
  app.disable("x-powered-by");
  app.use(
    cors({
      origin: webOrigin,
      credentials: true,
      allowedHeaders: ["content-type", "x-company-id", "x-branch-id", "x-fiscal-year-id"],
    }),
  );

  // Better Auth must see the raw body, so it is mounted before express.json().
  app.all("/api/auth/*splat", toNodeHandler(auth));

  app.use(express.json({ limit: "1mb" }));
  app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });

  // Everything below needs a signed-in user; module routers also get req.ctx
  // (company/branch/fiscal year, already checked against UserCompanyAccess).
  const authed = [requireAuth(auth, db)];
  const scoped = [...authed, companyContext(db)];
  app.use("/api/me", ...authed, meRouter(db));
  app.use("/api/agents", ...scoped, agentsRouter(db));
  app.use("/api/stock-categories", ...scoped, stockCategoriesRouter(db));
  app.use("/api/tax-rates", ...scoped, taxRatesRouter(db));
  app.use("/api/product-groups", ...scoped, productGroupsRouter(db));
  app.use("/api/areas", ...scoped, areasRouter(db));
  app.use("/api/units", ...scoped, unitsRouter(db));
  app.use("/api/locations", ...scoped, locationsRouter(db));
  // Feature routers are mounted here with `scoped`, one per migrated module.

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
