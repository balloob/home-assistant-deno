// Block until an entity is a specific state
// deno run --allow-net --allow-read https://raw.githubusercontent.com/balloob/home-assistant-deno/master/examples/block-until-state.ts --entity light.kitchen_lights --state on
import { parse } from "https://deno.land/std@0.54.0/flags/mod.ts";
import {
  getConnection,
  HassEntities,
  subscribeEntities,
} from "https://raw.githubusercontent.com/balloob/home-assistant-deno/master/mod.ts";

const args = parse(Deno.args);

if (!args.entity || !args.state) {
  console.error("Specify both --entity <entity_id> and --state <state>");
  Deno.exit(1);
}

const conn = await getConnection();

subscribeEntities(conn, (entities: HassEntities) => {
  if (entities[args.entity].state === args.state) {
    conn.close();
  }
});
