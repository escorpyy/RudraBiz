import { createApp } from "./app";
import { loadConfig } from "./config";

const config = loadConfig();
const app = createApp({ webOrigin: config.WEB_ORIGIN });
app.listen(config.PORT, () => {
  console.log(`API listening on http://localhost:${config.PORT}`);
});
