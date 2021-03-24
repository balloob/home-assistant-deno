// Block until Home Assistant is started
// deno run --allow-net --allow-read https://raw.githubusercontent.com/balloob/home-assistant-deno/master/examples/block-until-started.ts
import {
  getConnection,
  HassConfig,
  subscribeConfig,
} from "https://raw.githubusercontent.com/balloob/home-assistant-deno/master/mod.ts";

const conn = await getConnection();

subscribeConfig(conn, (config: HassConfig) => {
  if (config.state === "RUNNING") {
    conn.close();
  }
});
