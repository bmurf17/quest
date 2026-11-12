import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CharacterData } from "@/types/Character";
import { tempWarrior } from "@/data/fixtures/characters";
import type { Cutscene } from "@/types/Cutscene";
import { Directions } from "@/types/Directions";
import type { ActiveBuff } from "@/types/EnemyMove";
import { GameStatus } from "@/types/GameStatus";
import type { Room } from "@/types/Room";
import type { DialogueNode } from "@/types/RoomInteractions";
import { useGameStore } from "../GameState";
import { parseSaveData, SAVE_VERSION } from "../saveSchema";
import {
  buildSaveData,
  deleteSave,
  getSaveData,
  getSaveKeys,
  getSaveLabel,
  normalizeNeighbors,
  peekSaveData,
  saveToSlot,
  SaveDataError,
} from "../saveLoad";

vi.mock("@/lib/supabase", () => ({
  supabase: {},
  default: {},
}));

const initialState = useGameStore.getState();

function hero(overrides: Partial<CharacterData> = {}): CharacterData {
  return { ...tempWarrior, ...overrides };
}

function room(id: number, name: string): Room {
  return {
    id,
    name,
    sectionId: 0,
    enemies: [],
    neighboringRooms: [],
    interaction: null,
  };
}

function createStorage(): Storage {
  const data = new Map<string, string>();
  return {
    get length() {
      return data.size;
    },
    key: (index: number) => [...data.keys()][index] ?? null,
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value);
    },
    removeItem: (key: string) => {
      data.delete(key);
    },
    clear: () => {
      data.clear();
    },
  };
}

const dialogueTree: DialogueNode = {
  id: "intro",
  text: "Welcome, traveller.",
  speaker: "NPC",
  isEndpoint: true,
};

const cutscene: Cutscene = {
  id: "intro",
  scenes: [{ text: "A vision..." }],
};

const buff: ActiveBuff = {
  stat: "dex",
  amount: 2,
  remainingTurns: 3,
  source: "Bless",
};

function seedFullState() {
  const north = room(2, "North Room");
  const start = room(1, "Start Room");
  start.neighboringRooms = [[Directions.North, north]];

  useGameStore.setState({
    party: [hero()],
    room: start,
    roomInstances: new Map([
      [start.id, start],
      [north.id, north],
    ]),
    rooms: [start, north],
    dialogueTrees: new Map([[7, dialogueTree]]),
    activeCutscene: cutscene,
    cutscenes: new Map([[cutscene.id, cutscene]]),
    enemyCooldowns: new Map([[1, new Map([["Bite", 2]])]]),
    activeBuffs: new Map([["Warrior Example", [buff]]]),
    activityLog: ["Saved the day"],
    gameStatus: GameStatus.Exploring,
  });
}

function memorySave(overrides: Record<string, unknown> = {}) {
  seedFullState();
  const data = buildSaveData(useGameStore.getState(), "slot");
  return { ...data, ...overrides } as typeof data;
}

beforeEach(() => {
  useGameStore.setState(initialState, true);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("save/load round trip", () => {
  it("serializes neighbor references as ids", () => {
    seedFullState();
    const data = buildSaveData(useGameStore.getState(), "slot");

    expect(data.version).toBe(SAVE_VERSION);
    expect(data.label).toBe("slot");
    expect(data.currentRoomId).toBe(1);
    expect(data.activeCutsceneId).toBe("intro");

    const startEntry = data.roomInstances.find(([id]) => id === 1);
    expect(startEntry?.[1].neighboringRooms).toEqual([[Directions.North, 2]]);

    expect(data.dialogueTrees).toEqual([[7, dialogueTree]]);
    expect(data.enemyCooldowns).toEqual([[1, [["Bite", 2]]]]);
    expect(data.activeBuffs).toEqual([["Warrior Example", [buff]]]);
  });

  it("restores rooms, maps, dialogue, and the active fighter", () => {
    const data = memorySave();
    useGameStore.setState(initialState, true);
    useGameStore.setState({ cutscenes: new Map([[cutscene.id, cutscene]]) });

    // Load no longer relies on the previous store state.
    useGameStore.getState().loadGame(data);

    const state = useGameStore.getState();
    expect(state.room.id).toBe(1);
    expect(state.party[0].name).toBe("Warrior Example");
    expect(state.activityLog).toEqual(["Saved the day"]);
    expect(state.dialogueTrees.get(7)).toEqual(dialogueTree);
    expect(state.enemyCooldowns.get(1)?.get("Bite")).toBe(2);
    expect(state.activeBuffs.get("Warrior Example")?.[0]).toEqual(buff);
    expect(state.activeCutscene?.id).toBe("intro");

    const restoredStart = state.roomInstances.get(1);
    const restoredNorth = state.roomInstances.get(2);
    expect(restoredStart?.neighboringRooms[0][1]).toBe(restoredNorth);
  });

  it("throws when the saved current room is missing", () => {
    const data = memorySave({ currentRoomId: 99 });
    expect(() => useGameStore.getState().loadGame(data)).toThrow(
      /current room 99/,
    );
  });

  it("accepts legacy saves that predate cooldowns and buffs", () => {
    const legacy = memorySave({ version: 1 });
    delete (legacy as unknown as Record<string, unknown>).enemyCooldowns;
    delete (legacy as unknown as Record<string, unknown>).activeBuffs;

    // Migration happens on read; loading the result restores the defaults.
    const migrated = parseSaveData(legacy);
    useGameStore.getState().loadGame(migrated);

    const state = useGameStore.getState();
    expect(state.enemyCooldowns.size).toBe(0);
    expect(state.activeBuffs.size).toBe(0);
  });
});

describe("save slots", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", createStorage());
  });

  it("writes, lists, and deletes a slot", () => {
    seedFullState();
    saveToSlot("slot-one");

    expect(getSaveKeys()).toEqual(["slot-one"]);
    expect(getSaveLabel("slot-one")).toBe("slot-one");

    const loaded = getSaveData("slot-one");
    expect(loaded?.label).toBe("slot-one");
    expect(loaded?.party[0].name).toBe("Warrior Example");

    deleteSave("slot-one");
    expect(getSaveKeys()).toEqual([]);
    expect(getSaveData("slot-one")).toBeNull();
  });

  it("returns null for a slot that does not exist", () => {
    expect(getSaveData("missing")).toBeNull();
    expect(getSaveLabel("missing")).toBeNull();
    expect(peekSaveData("missing")).toBeNull();
  });

  it("rejects corrupt JSON with a SaveDataError", () => {
    localStorage.setItem("quest_save_bad", "{not json");
    expect(() => getSaveData("bad")).toThrow(SaveDataError);
    expect(peekSaveData("bad")).toBeNull();
  });

  it("migrates and validates legacy data read from storage", () => {
    const legacy = memorySave({ version: 1 });
    delete (legacy as unknown as Record<string, unknown>).enemyCooldowns;
    delete (legacy as unknown as Record<string, unknown>).activeBuffs;
    delete (legacy as unknown as Record<string, unknown>).cutsceneSceneIndex;

    localStorage.setItem("quest_save_legacy", JSON.stringify(legacy));

    const loaded = getSaveData("legacy");
    expect(loaded?.version).toBe(SAVE_VERSION);
    expect(loaded?.enemyCooldowns).toEqual([]);
    expect(loaded?.activeBuffs).toEqual([]);
    expect(loaded?.cutsceneSceneIndex).toBe(0);
  });
});

describe("normalizeNeighbors", () => {
  it("keeps room data but strips nested room objects", () => {
    const north = room(2, "North Room");
    const start = room(1, "Start Room");
    start.neighboringRooms = [[Directions.North, north]];

    const serialized = normalizeNeighbors(start);
    expect(serialized.name).toBe("Start Room");
    expect(serialized.neighboringRooms).toEqual([[Directions.North, 2]]);
  });
});
