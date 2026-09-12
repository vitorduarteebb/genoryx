import { Client, type Room } from "colyseus.js";
import type { EnterMapMessage, InteractMessage, MapTransferMessage, MoveInputMessage, NpcDialogueMessage, WorldMapKey } from "@nexora/types";
import { WORLD_MESSAGES } from "@nexora/types";

const GAME_URL = process.env.NEXT_PUBLIC_GAME_SERVER_URL ?? "ws://localhost:2567";

export type WorldRoom = Room;

export function createGameClient() {
  return new Client(GAME_URL);
}

export async function joinWorld(client: Client, mapKey: WorldMapKey, accessToken: string) {
  return client.joinOrCreate(mapKey, { accessToken });
}

export function sendMove(room: Room, payload: MoveInputMessage) {
  room.send(WORLD_MESSAGES.MOVE_INPUT, payload);
}

export function sendInteract(room: Room, payload: InteractMessage) {
  room.send(WORLD_MESSAGES.INTERACT, payload);
}

export function sendEnterMap(room: Room, payload: EnterMapMessage) {
  room.send(WORLD_MESSAGES.ENTER_MAP, payload);
}

export type { MapTransferMessage, NpcDialogueMessage };
