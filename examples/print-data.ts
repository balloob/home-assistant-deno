// Print data
// deno run --allow-net --allow-read https://raw.githubusercontent.com/balloob/home-assistant-deno/master/examples/print-data.ts --data area_registry
import { parse } from "https://deno.land/std@0.92.0/flags/mod.ts";
import { getConnection } from "https://raw.githubusercontent.com/balloob/home-assistant-deno/master/mod.ts";

const TYPES: { [key: string]: string } = {
  states: "get_states",
  config: "get_config",
  services: "get_services",
  user: "auth/current_user",
  // deno-lint-ignore camelcase
  area_registry: "config/area_registry/list",
  // deno-lint-ignore camelcase
  device_registry: "config/device_registry/list",
  // deno-lint-ignore camelcase
  entity_registry: "config/entity_registry/list",
};

const args = parse(Deno.args);

if (!args.data || TYPES[args.data] === undefined) {
  console.error("Specify data type --data <type>");
  console.error("Valid types are", Object.keys(TYPES).join(", "));
  Deno.exit(1);
}

const conn = await getConnection();

const result = await conn.sendMessagePromise({ type: TYPES[args.data] });

console.log(JSON.stringify(result, undefined, 2));

conn.close();
