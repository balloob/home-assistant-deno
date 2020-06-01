// Print entity states.
// deno run --allow-net --allow-read https://raw.githubusercontent.com/balloob/home-assistant-deno/master/examples/print-entity-states.ts
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
