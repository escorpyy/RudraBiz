import { createAuth } from "./auth/auth";
import { createApp } from "./app";
import { loadConfig } from "./config";
import { db } from "./db/client";

const config = loadConfig();
const auth = createAuth({
  db,
  secret: config.BETTER_AUTH_SECRET,
  baseURL: config.API_URL,
  webOrigin: config.WEB_ORIGIN,
});
const app = createApp({ webOrigin: config.WEB_ORIGIN, db, auth });
app.listen(config.PORT, () => {
  console.log(`API listening on ${config.API_URL}`);
});
