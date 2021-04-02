// Block until a notification is dismissed in Home Assistant
// deno run --allow-net --allow-read https://raw.githubusercontent.com/balloob/home-assistant-deno/master/examples/block-until-state.ts --message "I will block until this is dismissed"
// Optionally pass --title "Title of notification"
import { parse } from "https://deno.land/std@0.92.0/flags/mod.ts";
import {
  callService,
  getConnection,
  HassEntities,
  subscribeEntities,
} from "https://raw.githubusercontent.com/balloob/home-assistant-deno/master/mod.ts";

const args = parse(Deno.args);

if (!args.message) {
  console.error('Specify --message "<message>"');
  Deno.exit(1);
}

const conn = await getConnection();
const notificationId = "deno_block_till_dismissed";
const entityId = `persistent_notification.${notificationId}`;
let init = true;
let armed = false;

subscribeEntities(conn, (entities: HassEntities) => {
  if (init) {
    callService(conn, "persistent_notification", "create", {
      message: args.message,
      title: args.title,
      notification_id: notificationId,
    });
    init = false;
  } else if (armed && !(entityId in entities)) {
    conn.close();
  } else if (!armed && entityId in entities) {
    armed = true;
  }
});
