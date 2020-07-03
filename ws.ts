// To use:
// import { createConnection } from 'path/to/ws.ts'
// const conn = await createConnection(urlOfHomeAssistant, accessToken)

import {
  createLongLivedTokenAuth,
  createConnection as hawsCreateConnection,
  ERR_HASS_HOST_REQUIRED,
  ERR_INVALID_AUTH,
  ERR_CANNOT_CONNECT,
  Connection,
} from "https://unpkg.com/home-assistant-js-websocket@5/dist/index.js";
import * as messages from "https://unpkg.com/home-assistant-js-websocket@5/dist/messages.js";

import {
  WebSocket,
  connectWebSocket,
  isWebSocketCloseEvent,
} from "https://deno.land/std/ws/mod.ts";

// Types is from HAWS but we cannot import them from the JS
export type ConnectionOptions = {
  setupRetry: number;
  auth?: ReturnType<typeof createLongLivedTokenAuth>;
  createSocket: (options: ConnectionOptions) => Promise<JSWebSocket>;
};

export class ConnectionError extends Error {
  constructor(public code: number) {
    super();
  }
}

interface WSEvents {
  open: {};
  message: { data: string };
  close: {};
  error: {};
}

type WSEventType = keyof WSEvents;

const DEBUG = false;
export const MSG_TYPE_AUTH_REQUIRED = "auth_required";
export const MSG_TYPE_AUTH_INVALID = "auth_invalid";
export const MSG_TYPE_AUTH_OK = "auth_ok";

export class JSWebSocket {
  public haVersion?: string;

  private _listeners: {
    [type: string]: Array<(ev: any) => void>;
  } = {};
  // Trying to be fancy, TS doesn't like it.
  // private _listeners: {
  //   [E in WSEventType]?: Array<(ev: WSEvents[E]) => unknown>;
  // } = {};

  private _sock?: WebSocket;
  private _sockProm: Promise<WebSocket>;

  constructor(public endpoint: string) {
    this._sockProm = connectWebSocket(endpoint);
    this._sockProm.then(
      (sock) => {
        this._sock = sock;
        this._reader();
        this.emit("open", {});
      },
      (err) => {
        if (DEBUG) {
          console.error("[WS] Failed to connect", err);
        }
        this.emit("error", {});
      },
    );
  }

  emit<E extends WSEventType>(type: E, event: WSEvents[E]) {
    const handlers = this._listeners[type];
    if (!handlers) {
      return;
    }
    for (const handler of handlers) {
      handler(event);
    }
  }

  addEventListener<E extends WSEventType>(
    type: E,
    handler: (ev: WSEvents[E]) => unknown,
  ) {
    let handlers = this._listeners[type];
    if (!handlers) {
      handlers = this._listeners[type] = [];
    }
    handlers.push(handler);
  }

  removeEventListener<E extends WSEventType>(
    type: E,
    handler: (ev: WSEvents[E]) => unknown,
  ) {
    const handlers = this._listeners[type];
    if (!handlers) {
      return;
    }
    const index = handlers.indexOf(handler);
    if (index != -1) {
      handlers.splice(index);
    }
  }

  send(body: string) {
    if (
      DEBUG &&
      // When haVersion is set, we have authenticated.
      // So we don't log the auth token.
      this.haVersion
    ) {
      console.log("[WS] SENDING", body);
    }
    this._sock!.send(body);
  }

  close() {
    if (DEBUG) {
      console.log("[WS] Close requested");
    }
    this._sock!.close();
  }

  async _reader() {
    for await (const msg of this._sock!) {
      if (typeof msg === "string") {
        this.emit("message", { data: msg });
      } else if (isWebSocketCloseEvent(msg)) {
        this.emit("close", {});
      }
    }
  }
}

// Copy of https://github.com/home-assistant/home-assistant-js-websocket/blob/master/lib/socket.ts
export function createSocket(options: ConnectionOptions): Promise<JSWebSocket> {
  if (!options.auth) {
    throw ERR_HASS_HOST_REQUIRED;
  }
  const auth = options.auth;
  const url = auth.wsUrl;

  if (DEBUG) {
    console.log("[WS - Auth phase] Initializing", url);
  }

  function connect(
    triesLeft: number,
    promResolve: (socket: JSWebSocket) => void,
    promReject: (err: Error) => void,
  ) {
    if (DEBUG) {
      console.log("[WS - Auth Phase] New connection", url);
    }

    const socket = new JSWebSocket(url);

    // If invalid auth, we will not try to reconnect.
    let invalidAuth = false;

    const closeMessage = () => {
      // If we are in error handler make sure close handler doesn't also fire.
      socket.removeEventListener("close", closeMessage);
      if (invalidAuth) {
        return;
      }

      // Reject if we no longer have to retry
      if (triesLeft === 0) {
        // We never were connected and will not retry
        promReject(new ConnectionError(ERR_CANNOT_CONNECT));
        return;
      }

      const newTries = triesLeft === -1 ? -1 : triesLeft - 1;
      // Try again in a second
      setTimeout(() => connect(newTries, promResolve, promReject), 1000);
    };

    // Auth is mandatory, so we can send the auth message right away.
    const handleOpen = async () => {
      socket.send(JSON.stringify(messages.auth(auth.accessToken)));
    };

    const handleMessage = async (event: { data: string }) => {
      const message = JSON.parse(event.data);

      if (DEBUG) {
        console.log("[WS - Auth phase] Received", message);
      }
      switch (message.type) {
        case MSG_TYPE_AUTH_INVALID:
          promReject(new ConnectionError(ERR_INVALID_AUTH));
          socket.close();
          break;

        case MSG_TYPE_AUTH_OK:
          socket.removeEventListener("open", handleOpen);
          socket.removeEventListener("message", handleMessage);
          socket.removeEventListener("close", closeMessage);
          socket.removeEventListener("error", closeMessage);
          socket.haVersion = message.ha_version;
          promResolve(socket);
          break;

        default:
          if (DEBUG) {
            // We already send response to this message when socket opens
            if (message.type !== MSG_TYPE_AUTH_REQUIRED) {
              console.warn("[WS - Auth phase] Unhandled message", message);
            }
          }
      }
    };

    socket.addEventListener("open", handleOpen);
    socket.addEventListener("message", handleMessage);
    socket.addEventListener("close", closeMessage);
    socket.addEventListener("error", closeMessage);
  }

  return new Promise((resolve, reject) =>
    connect(options.setupRetry, resolve, reject)
  );
}

export function createConnection(
  endpoint: string,
  token: string,
): Promise<Connection> {
  const auth = createLongLivedTokenAuth(endpoint, token);

  return hawsCreateConnection({
    createSocket,
    auth,
  });
}

export {
  Connection,
  ERR_CANNOT_CONNECT,
  ERR_INVALID_AUTH,
  callService,
  getCollection,
  createCollection,
  getUser,
  getStates,
  getConfig,
  getServices,
  configColl,
  subscribeConfig,
  entitiesColl,
  subscribeEntities,
  servicesColl,
  subscribeServices,
} from "https://unpkg.com/home-assistant-js-websocket@5/dist/index.js";
export {
  Error,
  UnsubscribeFunc,
  MessageBase,
  HassEventBase,
  HassEvent,
  StateChangedEvent,
  HassConfig,
  HassEntityBase,
  HassEntityAttributeBase,
  HassEntity,
  HassEntities,
  HassService,
  HassDomainServices,
  HassServices,
  HassUser,
} from "https://raw.githubusercontent.com/home-assistant/home-assistant-js-websocket/master/lib/types.ts";
export { messages };
