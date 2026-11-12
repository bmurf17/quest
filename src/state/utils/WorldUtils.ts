import type { ActiveBuff } from "@/types/EnemyMove";
import { Directions } from "@/types/Directions";
import { GameStatus } from "@/types/GameStatus";
import type { Room } from "@/types/Room";
import { getDiscoveryMessage } from "@/types/RoomInteractions";
import { ActivityLogBuilder } from "./ActivityLogUtils";
import type { GameState } from "../slices/types";

export type MoveState = Pick<
  GameState,
  | "room"
  | "roomInstances"
  | "party"
  | "combatOrder"
  | "activityLog"
  | "enemyCooldowns"
  | "activeBuffs"
>;

/**
 * Work out the state changes for moving in a direction. Returns `null` when
 * there is no room in that direction, so the caller can skip the update.
 */
export function resolveMove(
  state: MoveState,
  direction: Directions,
): Partial<GameState> | null {
  const targetRoomTemplate = state.room.neighboringRooms.find(
    ([mapDirection]) => mapDirection === direction,
  )?.[1];

  if (!targetRoomTemplate) return null;

  let roomInstance = state.roomInstances.get(targetRoomTemplate.id);
  if (!roomInstance) {
    roomInstance = {
      ...targetRoomTemplate,
      enemies: targetRoomTemplate.enemies.map((enemy) => ({ ...enemy })),
    };
  }

  const status =
    roomInstance.enemies.length > 0
      ? GameStatus.Combat
      : GameStatus.Exploring;

  let combatOrder = state.combatOrder;
  if (status === GameStatus.Combat) {
    combatOrder = [...state.party, ...roomInstance.enemies];
  }

  const logBuilder = new ActivityLogBuilder()
    .add(`Your party has moved ${Directions[direction]}`)
    .addIf(
      status === GameStatus.Exploring && !!roomInstance.interaction,
      roomInstance.interaction
        ? getDiscoveryMessage(roomInstance.interaction)
        : "",
    )
    .addIf(
      roomInstance.enemies.length > 0,
      `You encounter ${roomInstance.enemies.length} ${
        roomInstance.enemies.length === 1 ? "enemy" : "enemies"
      }!`,
    );

  const newRoomInstances = new Map(state.roomInstances);
  newRoomInstances.set(targetRoomTemplate.id, roomInstance);

  return {
    activityLog: [...state.activityLog, ...logBuilder.build()],
    room: roomInstance,
    roomInstances: newRoomInstances,
    gameStatus: status,
    combatOrder,
    dialogueIndex: 0,
    activeDialogue: null,
    currentDialogueNodeId: null,
    enemyCooldowns:
      status === GameStatus.Combat
        ? new Map<number, Map<string, number>>()
        : state.enemyCooldowns,
    activeBuffs:
      status === GameStatus.Combat
        ? new Map<string, ActiveBuff[]>()
        : state.activeBuffs,
  };
}

/** Room instance that owns the current room, falling back to the room itself. */
export function getCurrentRoomInstance(state: {
  room: Room;
  roomInstances: Map<number, Room>;
}): Room {
  return state.roomInstances.get(state.room.id) || state.room;
}

/**
 * Key under which the current room instance is stored in `roomInstances`.
 * Prefers the instance identity, then the room id.
 */
export function getRoomInstanceKey(state: {
  room: Room;
  roomInstances: Map<number, Room>;
}): number | undefined {
  const currentRoomInstance = getCurrentRoomInstance(state);
  return [...state.roomInstances.entries()].find(
    ([templateId, instance]) =>
      instance === currentRoomInstance || templateId === state.room.id,
  )?.[0];
}
