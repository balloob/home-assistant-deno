// Block until a trigger definition is triggered
// deno run --allow-net --allow-read https://raw.githubusercontent.com/balloob/home-assistant-deno/master/examples/block-until-trigger.ts --trigger '{"platform":"state","entity_id":"light.office_lamp"}'
import { parse } from "https://deno.land/std@0.54.0/flags/mod.ts";
import { getConnection } from "https://raw.githubusercontent.com/balloob/home-assistant-deno/master/mod.ts";

const args = parse(Deno.args);

if (!args.trigger) {
  console.error("Specify --trigger");
  Deno.exit(1);
}

let trigger;

try {
  trigger = JSON.parse(args.trigger);
} catch (err) {
  console.error("Unable to parse trigger as JSON");
  console.error({ trigger: args.trigger, err });
  Deno.exit(1);
}

const conn = await getConnection();

conn.subscribeMessage(
  () => conn.close(),
  {
    type: "subscribe_trigger",
    trigger,
  },
  null,
);
