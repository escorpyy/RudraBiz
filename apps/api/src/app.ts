import express from "express";
import cors from "cors";
import { errorHandler, notFoundHandler } from "./http/errorHandler";

export interface AppOptions {
  webOrigin: string;
}

export function createApp(opts: AppOptions) {
  const app = express();
  app.disable("x-powered-by");
  app.use(cors({ origin: opts.webOrigin, credentials: true }));
  app.use(express.json({ limit: "1mb" }));

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });

  // Feature routers are mounted here, one per module, as they are migrated.

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
