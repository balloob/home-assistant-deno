// File exists so we can verify example in readme works.
import { getConnection, subscribeEntities, HassEntities } from "./mod.ts";
// import {
//   getConnection,
//   subscribeEntities,
//   HassEntities
// } from "https://raw.githubusercontent.com/balloob/home-assistant-deno/master/mod.ts";

const conn = await getConnection();

subscribeEntities(conn, (entities: HassEntities) => {
  for (const stateObj of Object.values(entities)) {
    console.log(stateObj.entity_id, stateObj.state);
  }
  conn.close();
});
