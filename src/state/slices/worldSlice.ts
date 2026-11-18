import type { Directions } from "@/types/Directions";
import type { ActiveBuff } from "@/types/EnemyMove";
import { GameStatus } from "@/types/GameStatus";
import type { Room, Section } from "@/types/Room";
import { startRoom } from "@/data/fixtures/rooms";
import type { Cutscene } from "@/types/Cutscene";
import type { Camp, Chest } from "@/types/RoomInteractions";
import { ActivityLogBuilder } from "@/state/utils/ActivityLogUtils";
import { getCurrentRoomInstance, getRoomInstanceKey, resolveMove } from "@/state/utils/WorldUtils";
import type { GameState, GameSlice } from "./types";

export type WorldSlice = Pick<
  GameState,
  | "room"
  | "roomInstances"
  | "rooms"
  | "gameStatus"
  | "move"
  | "rest"
  | "setRooms"
  | "addRoom"
  | "updateRoom"
  | "updateChest"
  | "takeFromChest"
  | "currentSection"
  | "beatenSections"
  | "availableSections"
  | "loadSections"
  | "startSection"
  | "completeSection"
  | "isSectionUnlocked"
  | "cutscenes"
  | "activeCutscene"
  | "cutsceneSceneIndex"
  | "loadCutscenes"
  | "playCutscene"
  | "advanceCutsceneScene"
  | "endCutscene"
>;

export const createWorldSlice: GameSlice<WorldSlice> = (set, get) => ({
  room: startRoom,
  roomInstances: new Map<number, Room>([
    [startRoom.id, { ...startRoom, enemies: startRoom.enemies.map((e) => ({ ...e })) }],
  ]),
  rooms: [],
  gameStatus: GameStatus.Exploring,
  currentSection: null,
  beatenSections: [],
  availableSections: [],
  cutscenes: new Map<string, Cutscene>(),
  activeCutscene: null,
  cutsceneSceneIndex: 0,

  rest: (camp: Camp) =>
    set((state) => {
      const updatedParty = state.party.map((member) => {
        const newHp = Math.min(member.maxHp, member.hp + camp.healAmount);
        const newMp = Math.min(member.maxMp, member.mp + camp.healAmount);
        return {
          ...member,
          hp: newHp,
          mp: newMp,
          alive: newHp > 0,
        };
      });

      const logBuilder = new ActivityLogBuilder().add(
        `Your party rests and heals ${camp.healAmount} HP. Everyone is ready for battle!`,
      );

      return {
        party: updatedParty,
        activityLog: [...state.activityLog, ...logBuilder.build()],
      };
    }),

  move: (direction: Directions) => {
    const updates = resolveMove(get(), direction);
    if (updates) set(updates);
  },

  setRooms: (rooms: Room[]) => set({ rooms }),

  addRoom: (room: Room) =>
    set((state) => ({
      rooms: [...state.rooms, room],
    })),

  updateRoom: (room: Room) =>
    set((state) => ({
      rooms: state.rooms.map((x) => (x.name !== room.name ? x : room)),
    })),

  updateChest: (chest: Chest) =>
    set((state) => {
      const currentRoomInstance = getCurrentRoomInstance(state);
      const logBuilder = new ActivityLogBuilder().add("You have opened the chest!");
      const updatedRoom: Room = {
        ...currentRoomInstance,
        interaction: { type: "chest", chest },
      };

      const originalTemplateId = getRoomInstanceKey(state);
      const newRoomInstances = new Map(state.roomInstances);
      if (originalTemplateId !== undefined) {
        newRoomInstances.set(originalTemplateId, updatedRoom);
      }

      return {
        activityLog: [...state.activityLog, ...logBuilder.build()],
        room: updatedRoom,
        roomInstances: newRoomInstances,
      };
    }),

  takeFromChest: (chest: Chest) =>
    set((state) => {
      const currentRoomInstance = getCurrentRoomInstance(state);
      const logBuilder = new ActivityLogBuilder().add("You take from the chest!");
      const updatedRoom: Room = {
        ...currentRoomInstance,
        interaction: { type: "chest", chest: { ...chest } },
      };

      const originalTemplateId = getRoomInstanceKey(state);
      const newRoomInstances = new Map(state.roomInstances);
      if (originalTemplateId !== undefined) {
        newRoomInstances.set(originalTemplateId, updatedRoom);
      }

      const inventory = [...state.inventory];
      if (chest.item) {
        inventory.push(chest.item);
      }

      return {
        activityLog: [...state.activityLog, ...logBuilder.build()],
        room: updatedRoom,
        roomInstances: newRoomInstances,
        inventory,
      };
    }),

  loadSections: (sections: Section[]) => set({ availableSections: sections }),

  startSection: (sectionId: number, rooms: Room[]) =>
    set((state) => {
      const sectionRooms = rooms.filter((r) => r.sectionId === sectionId);
      if (sectionRooms.length === 0) return state;

      const startRoomId = state.availableSections.find((s) => s.id === sectionId)?.startRoomId;
      // Fall back to the first room (rooms load ordered by id) when a section
      // has no explicit start room yet, including older saves.
      const firstRoom =
        (startRoomId != null ? sectionRooms.find((r) => r.id === startRoomId) : undefined) ??
        sectionRooms[0];
      const roomInstance = {
        ...firstRoom,
        enemies: firstRoom.enemies.map((e) => ({ ...e })),
      };

      return {
        currentSection: sectionId,
        room: roomInstance,
        roomInstances: new Map([[firstRoom.id, roomInstance]]),
        gameStatus: GameStatus.Exploring,
        combatOrder: firstRoom.enemies.length > 0 ? [...state.party, ...firstRoom.enemies] : [],
        activityLog: [
          ...state.activityLog,
          `You begin exploring ${state.availableSections.find((s) => s.id === sectionId)?.name ?? "an unknown area"}...`,
        ],
        enemyCooldowns: new Map<number, Map<string, number>>(),
        activeBuffs: new Map<string, ActiveBuff[]>(),
      };
    }),

  completeSection: () =>
    set((state) => {
      if (state.currentSection === null) return state;
      if (state.beatenSections.includes(state.currentSection)) return state;

      const sectionName =
        state.availableSections.find((s) => s.id === state.currentSection)?.name ?? "the area";

      return {
        beatenSections: [...state.beatenSections, state.currentSection],
        activityLog: [...state.activityLog, `You have completed ${sectionName}!`],
      };
    }),

  isSectionUnlocked: (sectionId: number) => {
    const state = get();
    if (sectionId === 1) return true;
    return state.beatenSections.includes(sectionId - 1);
  },

  loadCutscenes: (cutscenes: Cutscene[]) =>
    set(() => {
      const cutsceneMap = new Map<string, Cutscene>();
      for (const cutscene of cutscenes) {
        cutsceneMap.set(cutscene.id, cutscene);
      }
      return { cutscenes: cutsceneMap };
    }),

  playCutscene: (id: string) =>
    set((state) => {
      const cutscene = state.cutscenes.get(id);
      if (!cutscene) return state;
      return {
        activeCutscene: cutscene,
        cutsceneSceneIndex: 0,
        activityLog: [...state.activityLog, "A vision begins to unfold before your eyes..."],
      };
    }),

  advanceCutsceneScene: () =>
    set((state) => {
      if (!state.activeCutscene) return state;
      const nextIndex = state.cutsceneSceneIndex + 1;
      if (nextIndex < state.activeCutscene.scenes.length) {
        return { cutsceneSceneIndex: nextIndex };
      }
      if (state.activeCutscene.nextCutsceneId) {
        const nextCutscene = state.cutscenes.get(state.activeCutscene.nextCutsceneId);
        if (nextCutscene) {
          return {
            activeCutscene: nextCutscene,
            cutsceneSceneIndex: 0,
          };
        }
      }
      return {
        activeCutscene: null,
        cutsceneSceneIndex: 0,
      };
    }),

  endCutscene: () =>
    set({
      activeCutscene: null,
      cutsceneSceneIndex: 0,
    }),
});
