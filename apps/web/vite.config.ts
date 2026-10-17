import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// In dev the browser talks only to Vite (5173); /api is proxied to Express so
// session cookies are same-origin and no CORS setup is needed.
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, proxy: { "/api": "http://localhost:4000" } },
});
