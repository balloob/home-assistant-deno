// Helper to store auth credentials
// deno run --allow-net --allow-read --allow-write https://raw.githubusercontent.com/balloob/home-assistant-deno/master/login.ts
import { getHassHost, storeConnection } from "./profile.ts";
import {
  createConnection,
  ERR_CANNOT_CONNECT,
  ERR_INVALID_AUTH,
  getUser,
} from "./ws.ts";
import { readLines } from "./deps.ts";

let host!: string;
let token!: string;

console.log("Please enter your Home Assistant host:");
for await (const suggestedHost of readLines(Deno.stdin)) {
  let parsed: URL | undefined;

  try {
    parsed = new URL(suggestedHost);
  } catch {
    console.error(
      "Invalid URL. Make sure you include the protocol http: or https:",
    );
    continue;
  }

  if (parsed !== undefined) {
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      console.error(
        "Home Assistant url needs to start with 'http://' or 'https://'",
      );
    } else {
      host = getHassHost(parsed.toString());
      break;
    }
  }

  console.log("Please enter your Home Assistant host:");
}
console.log("");

// Verify the instance is reachable
try {
  const resp = await fetch(`${host}/api/discovery_info`);
  if (!resp.ok) {
    throw new Error(`Unexpected response: ${resp.status}/${resp.statusText}`);
  }
  const instanceData = await resp.json();
  console.log(
    `Discovered Home Assistant installation ${instanceData.location_name} (version ${instanceData.version})`,
  );
  console.log("");
} catch (err) {
  console.error("Unable to verify host");
  console.error(err);
  Deno.exit(1);
}

console.log("Long lived access token:");
for await (const suggestedToken of readLines(Deno.stdin)) {
  // Handle accidental enter
  if (suggestedToken) {
    token = suggestedToken;
    break;
  }
  console.log("Long lived access token:");
}

// validate connection info
let conn;
try {
  conn = await createConnection(host, token);
} catch (err) {
  if ("code" in err) {
    if (err.code == ERR_CANNOT_CONNECT) {
      console.error(`Error! Unable to connect to ${host}`);
      Deno.exit(1);
    }
    if (err.code == ERR_INVALID_AUTH) {
      console.error("Error! Invalid authentication");
      Deno.exit(1);
    }
  }
  console.error("Unknown error", err);
  Deno.exit(1);
}

const user = await getUser(conn);

console.log("");
console.log(`Successfully authenticated as ${user.name}`);
conn.close();

storeConnection(host, token);
console.log("Authentication saved.");
