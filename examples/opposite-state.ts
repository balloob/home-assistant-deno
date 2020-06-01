// Keep one entity in opposite state of one another
// Works only with entities that are on/off.
// deno run --allow-net --allow-read https://raw.githubusercontent.com/balloob/home-assistant-deno/master/examples/opposite-state.ts --from light.kitchen_lights --to light.bed_lights
import { parse } from "https://deno.land/std@0.54.0/flags/mod.ts";
import {
  getConnection,
  subscribeEntities,
  HassEntities,
  HassEntity,
  callService,
} from "https://raw.githubusercontent.com/balloob/home-assistant-deno/master/mod.ts";

const args = parse(Deno.args);

if (!args.from || !args.to) {
  console.error("Specify both --from <entity_id> and --to <entity_id>");
  Deno.exit(1);
}

const conn = await getConnection();

// light.kitchen -> light
const serviceDomain = args.to.split(".", 1)[0];

let lastState: HassEntity;

subscribeEntities(conn, async (entities: HassEntities) => {
  const fromState = entities[args.from];

  if (fromState === lastState) {
    return;
  }

  lastState = fromState;
  const serviceName = fromState.state === "on" ? "turn_off" : "turn_on";
  await callService(conn, serviceDomain, serviceName, { entity_id: args.to });
});
