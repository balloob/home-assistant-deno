/*
Run an automation

  deno run --allow-net --allow-read https://raw.githubusercontent.com/balloob/home-assistant-deno/master/examples/run-automation.ts --path automation.yaml

Automation file should follow the HA automation syntax, like this:

trigger:
  platform: state
  entity_id: light.office_lamp
  to: "on"
# Optional
condition:
  condition: state
  entity_id: sun.sun
  state: below_horizon
action:
  service: light.toggle
  entity_id: light.speaker_lamp

*/

import { parse as parseArgs } from "https://deno.land/std@0.92.0/flags/mod.ts";
import { parse as parseYaml } from "https://deno.land/std@0.92.0/encoding/yaml.ts";
import { getConnection } from "https://raw.githubusercontent.com/balloob/home-assistant-deno/master/mod.ts";

const args = parseArgs(Deno.args);

if (!args.path) {
  console.error("Specify --path <automation.yaml>");
  Deno.exit(1);
}

let content: string;

try {
  content = await Deno.readTextFile(args.path);
} catch (err) {
  console.error("Error reading file", args.path);
  console.error(err);
  Deno.exit(1);
}
const automation = parseYaml(content) as {
  trigger: unknown;
  condition?: unknown;
  action: unknown;
};

const conn = await getConnection();

try {
  await conn.subscribeMessage(
    async (triggerResultMsg: any) => {
      if (automation.condition) {
        let result;

        try {
          result = await conn.sendMessagePromise({
            type: "test_condition",
            condition: automation.condition,
            variables: triggerResultMsg.variables,
          });
        } catch (err) {
          console.error("Error testing condition");
          console.error(err);
          conn.close();
          Deno.exit(1);
        }

        if (!result.result) {
          return;
        }
      }
      try {
        await conn.sendMessagePromise({
          type: "execute_script",
          sequence: automation.action,
        });
      } catch (err) {
        console.error("Error running action");
        console.error(err);
        conn.close();
        Deno.exit(1);
      }
    },
    {
      type: "subscribe_trigger",
      trigger: automation.trigger,
    },
    null,
  );
} catch (err) {
  console.error("Error setting up automation");
  console.error(err);
  conn.close();
  Deno.exit(1);
}
