import { createAuthClient } from "better-auth/react";

// Same-origin: Vite proxies /api to Express in dev, and production serves both together.
export const authClient = createAuthClient();
