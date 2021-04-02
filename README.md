# Home Assistant Deno

Helpers to easily control [Home Assistant](https://www.home-assistant.io/) from
Deno.

_Experiment playing with Deno and how to organize a package._

## Getting Started

1. [Install Deno](https://deno.land/#installation)
2. Run the login script:

   ```bash
   deno run --allow-net --allow-write --allow-read https://raw.githubusercontent.com/balloob/home-assistant-deno/master/login.ts
   ```

   Authentication is stored in the current directory in a file called
   `hass.auth`.

   _This script needs write access to be able to write the authentication file._

   _This script needs network access to be able to connect to your Home
   Assistant instance to verify the credentials._

3. Create a new file `print-entity-states.ts` with content:

   ```ts
   import {
     getConnection,
     getStates,
     HassEntities,
   } from "https://raw.githubusercontent.com/balloob/home-assistant-deno/master/mod.ts";

   const conn = await getConnection();
   const states: HassEntities = await getStates(conn);
   for (const stateObj of Object.values(states)) {
     console.log(stateObj.entity_id, stateObj.state);
   }
   conn.close();
   ```

4. Run it:

   ```bash
   deno --allow-read --allow-net my-script.ts
   ```

   This will connect to your Home Assistant instance, fetch all the available
   entity states and print them.

   _This script needs read access to be able to read the authentication file._

   _This script needs network access to be able to connect to your Home
   Assistant instance._

## Example: block until state

In this example we're going to stream data from Home Assistant until an entity
is a desired state.

Create a new file called `block-until-state.ts` with content:

```ts
import { parse } from "https://deno.land/std@0.92.0/flags/mod.ts";
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
```

Run it with:

```bash
deno run --allow-net --allow-read block-until-state.ts --entity light.kitchen_lights --state on
```

This script will finish execution once `light.kitchen_lights` is turned on. If
it is on when the script starts, it finishes right away.

## Example: opposite state enforcer

In this example we're going to show how we can call services.

Create a new file called `opposite-state.ts` with content:

```ts
import { parse } from "https://deno.land/std@0.92.0/flags/mod.ts";
import {
  callService,
  getConnection,
  HassEntities,
  HassEntity,
  subscribeEntities,
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
```

Run it with:

```bash
deno run --allow-net --allow-read opposite-state.ts --from light.kitchen_lights --to light.bed_lights
```

This script will stream the latest state from your Home Assistant instance, and
will make sure that the entity passed in as `--to` will always be the opposite
of the entity passed in as `--from`. So if the `--from` entity turns `on`, the
`--to` entity will be turned off.

## Creating your own scripts

This tool wraps
[home-assistant-js-websocket](https://github.com/home-assistant/home-assistant-js-websocket/),
the WebSocket library that powers the Home Assistant frontend.

For a list of available methods,
[see its docs](https://github.com/home-assistant/home-assistant-js-websocket/#entities).
You can import all those helpers from
`https://raw.githubusercontent.com/balloob/home-assistant-deno/master/mod.ts`.
