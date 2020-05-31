# Home Assistant Deno

Helpers to easily control Home Assistant from Deno.

_Experiment playing with Deno and how to organize a package._

## Getting Started

1. [Install Deno](https://deno.land/#installation)
2. Run the login script:

   ```bash
   deno run --allow-net --allow-write https://raw.githubusercontent.com/balloob/home-assistant-deno/master/login.ts
   ```

   Authentication is stored in the current directory in a file called `hass.auth`.

   _This script needs write access to be able to write the authentication file._

   _This script needs network access to be able to connect to your Home Assistant instance to verify the credentials._

3. Create a new file `my-script.ts` with content:

   ```ts
   import {
     getConnection,
     HassEntities,
     getStates,
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

   This will print all entity IDs and their current state.

   _This script needs read access to be able to read the authentication file._

   _This script needs network access to be able to connect to your Home Assistant instance._

## More examples

This repostiry contains one more example: [block-until-state.ts](https://github.com/balloob/home-assistant-deno/blob/master/block-until-state.ts). This script will block until an entity is in a specific state.

```bash
deno run --allow-net --allow-read https://raw.githubusercontent.com/balloob/home-assistant-deno/master/block-until-state.ts --entity light.kitchen --state on
```

## Creating your own scripts

The helpers in this repository help you set up a WebSocket connection with Home Assistant so you can access the real-time data. This is done by wrapping [home-assistant-js-websocket](https://github.com/home-assistant/home-assistant-js-websocket/), the WebSocket library that powers the Home Assistant frontend.

For a list of available methods, [see here](https://github.com/home-assistant/home-assistant-js-websocket/#entities).
