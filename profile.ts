import { parseArgs } from "./deps.ts";
import {
  Connection,
  createConnection,
  ERR_CANNOT_CONNECT,
  ERR_INVALID_AUTH,
} from "./ws.ts";

const PROFILE_FILE = "hass.auth";

interface Profile {
  host: string;
  token: string;
  type: "long_lived_access_token";
}

/**
 * Extract the Home Assistant host from a Home Assistant url.
 *
 * Removes all relative paths and rewrites localhost to 127.0.0.1
 * @param url path to a Home Assistant instance.
 */
export function getHassHost(url: string): string {
  const temp = new URL(url);
  temp.pathname = "";
  temp.search = "";
  temp.hash = "";

  const processedHost = temp.hostname !== "localhost"
    ? temp.host
    : temp.port
    ? `127.0.0.1:${temp.port}`
    : "127.0.0.1";

  return `${temp.protocol}//${processedHost}`;
}

/**
 * Get a connection.
 *
 * 1. Look at passed in arguments --host and --token.
 * 2. See if we have read access and if so check for stored profile.
 */
export async function getConnection(): Promise<Connection> {
  let conn: Connection | undefined;

  try {
    conn = await getArgsConnection();

    if (conn === undefined) {
      conn = await getProfileConnection();
    }
  } catch (err) {
    if ("code" in err) {
      if (err.code == ERR_CANNOT_CONNECT) {
        console.error("Unable to connect. Did you run Deno with --allow-net?");
        Deno.exit(1);
      }
      if (err.code == ERR_INVALID_AUTH) {
        console.error("Invalid authentication");
        Deno.exit(1);
      }
    }
    console.error("Unknown error", err);
    Deno.exit(1);
  }

  if (conn === undefined) {
    console.error(
      "No connection specified. Specify a connection by passing --host and --token",
    );
    console.error(
      "Or login to store credentials: deno run --allow-net --allow-write --allow-read https://raw.githubusercontent.com/balloob/home-assistant-deno/master/login.ts",
    );
    Deno.exit(1);
  }

  return conn;
}

export async function getArgsConnection(): Promise<Connection | undefined> {
  const args = parseArgs(Deno.args);

  if (!args.host && !args.token) {
    return undefined;
  }
  if (!args.host || !args.token) {
    console.error("You need to specify both --host and --token");
    Deno.exit(1);
  }

  return await createConnection(getHassHost(args.host), args.token);
}

export async function getProfileConnection(): Promise<Connection | undefined> {
  const defaultProfile = (await getProfiles()).default;

  if (!defaultProfile) {
    return undefined;
  }

  return await createConnection(defaultProfile.host, defaultProfile.token);
}

export async function storeConnection(host: string, token: string) {
  const profiles = await getProfiles();
  profiles["default"] = {
    host,
    token,
    type: "long_lived_access_token",
  };
  await Deno.writeTextFile(
    PROFILE_FILE,
    JSON.stringify(profiles, undefined, 2),
  );
}

async function getProfiles(): Promise<{ [name: string]: Profile }> {
  let raw;
  try {
    raw = await Deno.readTextFile(PROFILE_FILE);
  } catch (err) {
    if (err instanceof Deno.errors.PermissionDenied) {
      throw err;
    }
    return {};
  }
  return JSON.parse(raw);
}
