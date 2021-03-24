// To use:
// import { createConnection } from 'path/to/ws.ts'
// const conn = await createConnection(urlOfHomeAssistant, accessToken)

import {
  Connection,
  createConnection as hawsCreateConnection,
  createLongLivedTokenAuth,
} from "https://unpkg.com/home-assistant-js-websocket@5/dist/index.js";
import * as messages from "https://unpkg.com/home-assistant-js-websocket@5/dist/messages.js";

export const MSG_TYPE_AUTH_REQUIRED = "auth_required";
export const MSG_TYPE_AUTH_INVALID = "auth_invalid";
export const MSG_TYPE_AUTH_OK = "auth_ok";

export function createConnection(
  endpoint: string,
  token: string,
): Promise<Connection> {
  const auth = createLongLivedTokenAuth(endpoint, token);

  return hawsCreateConnection({
    auth,
  });
}

export {
  callService,
  configColl,
  Connection,
  createCollection,
  entitiesColl,
  ERR_CANNOT_CONNECT,
  ERR_INVALID_AUTH,
  getCollection,
  getConfig,
  getServices,
  getStates,
  getUser,
  servicesColl,
  subscribeConfig,
  subscribeEntities,
  subscribeServices,
} from "https://unpkg.com/home-assistant-js-websocket@5/dist/index.js";
export type {
  Error,
  HassConfig,
  HassDomainServices,
  HassEntities,
  HassEntity,
  HassEntityAttributeBase,
  HassEntityBase,
  HassEvent,
  HassEventBase,
  HassService,
  HassServices,
  HassUser,
  MessageBase,
  StateChangedEvent,
  UnsubscribeFunc,
} from "https://raw.githubusercontent.com/home-assistant/home-assistant-js-websocket/master/lib/types.ts";
export { messages };
