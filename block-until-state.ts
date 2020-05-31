// Block until an entity is a specific state
import { parseArgs } from "./deps.ts";
import { getConnection } from "./profile.ts";
import { subscribeEntities } from "./ws.ts";

const args = parseArgs(Deno.args);

if (!args.entity || !args.state) {
  console.error("Specify both --entity <string> and --state <string>");
  Deno.exit(1);
}

const conn = await getConnection();

subscribeEntities(conn, (entities: any) => {
  if (entities[args.entity].state === args.state) {
    conn.close();
  }
});
