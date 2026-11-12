import type { ActiveBuff } from "@/types/EnemyMove";
import type { Room } from "@/types/Room";
import type { DialogueNode } from "@/types/RoomInteractions";
import type { SaveData } from "@/state/saveLoad";
import { pickDirectSaveFields } from "@/state/saveLoad";
import { SaveDataError } from "@/state/saveSchema";
import { hydrateRoomInstances } from "@/state/saveTransforms";
import type { GameState, GameSlice } from "./types";

export type SaveSlice = Pick<GameState, "loadGame">;

export const createSaveSlice: GameSlice<SaveSlice> = (set, get) => ({
  loadGame: (data: SaveData) => {
    const state = get();

    const roomLookup = new Map<number, Room>();
    for (const room of state.rooms) {
      roomLookup.set(room.id, room);
    }

    const roomInstances = hydrateRoomInstances(data.roomInstances, roomLookup);

    const dialogueTrees = new Map<number, DialogueNode>();
    for (const [id, node] of data.dialogueTrees) {
      dialogueTrees.set(id, node);
    }

    const currentRoom =
      roomInstances.get(data.currentRoomId) ?? state.rooms.find((r) => r.id === data.currentRoomId);
    if (!currentRoom) {
      throw new SaveDataError(
        `Save references current room ${data.currentRoomId}, which was not found`,
      );
    }

    const enemyCooldowns = new Map<number, Map<string, number>>();
    if (data.enemyCooldowns) {
      for (const [enemyId, entries] of data.enemyCooldowns) {
        enemyCooldowns.set(enemyId, new Map(entries));
      }
    }

    const activeBuffs = new Map<string, ActiveBuff[]>();
    if (data.activeBuffs) {
      for (const [name, buffs] of data.activeBuffs) {
        activeBuffs.set(name, buffs);
      }
    }

    // Fields copied verbatim come from the shared save-shape helper, so new
    // state fields cannot be forgotten here.
    set({
      ...pickDirectSaveFields(data),
      room: currentRoom,
      roomInstances,
      dialogueTrees,
      activeCutscene: data.activeCutsceneId
        ? (state.cutscenes.get(data.activeCutsceneId) ?? null)
        : null,
      enemyCooldowns,
      activeBuffs,
    });
  },
});
