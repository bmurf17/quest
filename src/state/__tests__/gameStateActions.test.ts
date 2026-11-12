import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CharacterData } from "@/types/Character";
import { tempWarrior } from "@/data/fixtures/characters";
import type { Enemy } from "@/types/Enemy";
import { GameStatus } from "@/types/GameStatus";
import type { Consumable, Item } from "@/types/Item";
import { healthPotion } from "@/data/items";
import type { Room } from "@/types/Room";
import { useGameStore } from "@/state/GameState";

vi.mock("@/lib/supabase", () => ({
  supabase: {},
  default: {},
}));

const initialState = useGameStore.getState();

function hero(overrides: Partial<CharacterData> = {}): CharacterData {
  return {
    ...tempWarrior,
    equipment: {
      helmet: null,
      armor: null,
      weapon: null,
      shield: null,
      accessory1: null,
      accessory2: null,
      boots: null,
    },
    ...overrides,
  };
}

function enemy(overrides: Partial<Enemy> = {}): Enemy {
  return {
    id: 1,
    name: "Goblin",
    health: 20,
    strength: 4,
    dex: 2,
    defense: 1,
    img: "",
    expGain: 10,
    ...overrides,
  };
}

function room(overrides: Partial<Room> = {}): Room {
  return {
    id: 1,
    name: "Room",
    sectionId: 0,
    enemies: [],
    neighboringRooms: [],
    interaction: null,
    ...overrides,
  };
}

function seedCombat(party: CharacterData[], enemies: Enemy[]) {
  const currentRoom = room({ enemies });
  useGameStore.setState({
    party,
    room: currentRoom,
    roomInstances: new Map([[currentRoom.id, currentRoom]]),
    gameStatus: GameStatus.Combat,
    activityLog: [],
    combatOrder: [],
    activeFighterIndex: 0,
  });
  return currentRoom;
}

beforeEach(() => {
  useGameStore.setState(initialState, true);
  vi.useFakeTimers();
});

afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("combat turn order", () => {
  it("builds the combat order from the party followed by room enemies", () => {
    const warrior = hero({ name: "Warrior" });
    const cleric = hero({ name: "Cleric", class: "Cleric" });
    const goblin = enemy({ id: 1, name: "Goblin" });
    const orc = enemy({ id: 2, name: "Orc" });
    seedCombat([warrior, cleric], [goblin, orc]);

    useGameStore.getState().enterCombat();

    const state = useGameStore.getState();
    expect(state.combatOrder.map((f) => f.name)).toEqual([
      "Warrior",
      "Cleric",
      "Goblin",
      "Orc",
    ]);
    expect(state.activeFighterIndex).toBe(0);
    expect(state.isCurrentFighterEnemy()).toBe(false);

    useGameStore.setState({ activeFighterIndex: 2 });
    expect(useGameStore.getState().isCurrentFighterEnemy()).toBe(true);
  });

  it("advances the active fighter after an attack", () => {
    const warrior = hero({ name: "Warrior" });
    const goblin = enemy({ health: 100, defense: 5 });
    seedCombat([warrior], [goblin]);
    useGameStore.getState().enterCombat();

    // A zero roll misses, so the enemy survives and combat continues.
    vi.spyOn(Math, "random").mockReturnValue(0);
    useGameStore.getState().attack(goblin);

    const state = useGameStore.getState();
    expect(state.gameStatus).toBe(GameStatus.Combat);
    expect(state.activeFighterIndex).toBe(1);
    expect(state.lastHitEnemyId).toBe("1");
    expect(state.combatOrder).toHaveLength(2);
  });
});

describe("consumables", () => {
  it("consumes an item and applies its healing", () => {
    const warrior = hero({ name: "Warrior", hp: 5, maxHp: 20 });
    useGameStore.setState({
      party: [warrior],
      inventory: [healthPotion],
      gameStatus: GameStatus.Exploring,
      activityLog: [],
      activeFighterIndex: 0,
    });

    useGameStore.getState().consumeItem(healthPotion, warrior);

    const state = useGameStore.getState();
    expect(state.party[0].hp).toBe(8);
    expect(state.inventory).toHaveLength(0);
    expect(state.activityLog).toContain(healthPotion.effect);
  });

  it("revives a fallen member and adds them back to the combat order", () => {
    const fallen = hero({ name: "Fallen", hp: 0, alive: false });
    const goblin = enemy();
    const potion: Consumable = { ...healthPotion, hpChange: 6 };

    useGameStore.setState({
      party: [fallen],
      inventory: [potion] as Item[],
      gameStatus: GameStatus.Combat,
      combatOrder: [goblin],
      activeFighterIndex: 0,
      activityLog: [],
    });

    useGameStore.getState().consumeItem(potion, fallen);

    const state = useGameStore.getState();
    expect(state.party[0].hp).toBe(6);
    expect(state.party[0].alive).toBe(true);
    expect(state.combatOrder.map((f) => f.name)).toContain("Fallen");
    expect(state.activeFighterIndex).toBe(1);
  });
});

describe("levelling up", () => {
  it("applies a level up and clears the level-up queue", () => {
    const warrior = hero({ name: "Warrior", level: 1 });
    const levelled = hero({
      name: "Warrior",
      level: 2,
      hp: 30,
      maxHp: 30,
      nextLevelExp: 100,
    });

    useGameStore.setState({
      party: [warrior],
      levelingUpChars: [levelled],
      isLevelingUp: true,
      currentLevelingCharIndex: 0,
    });

    useGameStore.getState().applyLevelUp(levelled);

    const state = useGameStore.getState();
    expect(state.party[0]).toBe(levelled);
    expect(state.isLevelingUp).toBe(false);
    expect(state.levelingUpChars).toEqual([]);
    expect(state.currentLevelingCharIndex).toBe(-1);
  });

  it("queues a level up when a kill grants enough experience", () => {
    const warrior = hero({ name: "Warrior", exp: 45, nextLevelExp: 50 });
    const goblin = enemy({ health: 1, defense: 0, expGain: 10 });
    seedCombat([warrior], [goblin]);
    useGameStore.getState().enterCombat();

    // High rolls guarantee a hit and enough damage to kill the goblin.
    vi.spyOn(Math, "random").mockReturnValue(0.9);
    useGameStore.getState().attack(goblin);

    const state = useGameStore.getState();
    expect(state.gameStatus).toBe(GameStatus.Exploring);
    expect(state.combatOrder.map((f) => f.name)).toEqual(["Warrior"]);
    expect(state.party[0].exp).toBe(55);
    expect(state.levelingUpChars).toHaveLength(1);
    expect(state.levelingUpChars[0].name).toBe("Warrior");
    expect(state.isLevelingUp).toBe(true);
    expect(state.currentLevelingCharIndex).toBe(0);
  });
});
