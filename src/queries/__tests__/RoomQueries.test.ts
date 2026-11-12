import { describe, expect, it, vi } from "vitest";
import {
  mapDbEnemy,
  mapDbItem,
  mapDbQuest,
  type DbEnemy,
  type DbItem,
  type DbQuest,
} from "@/queries/RoomQueries";

vi.mock("@/lib/supabase", () => ({
  supabase: {},
  default: {},
}));

function enemyRow(overrides: Partial<DbEnemy> = {}): DbEnemy {
  return {
    id: 3,
    name: "Goblin",
    health: 8,
    max_health: null,
    strength: 2,
    dex: 3,
    defense: 1,
    img: "/goblin.png",
    exp_gain: null,
    type: null,
    phase_thresholds: null,
    moves: null,
    spawns: null,
    ...overrides,
  };
}

function itemRow(overrides: Partial<DbItem> = {}): DbItem {
  return {
    name: "Health Potion",
    value: 2,
    img: "/potion.png",
    type: "consumable",
    effect: null,
    hp_change: null,
    mana_change: null,
    target: null,
    stack_size: null,
    slot: null,
    cost: 3,
    stats: null,
    action: null,
    ...overrides,
  };
}

function questRow(overrides: Partial<DbQuest> = {}): DbQuest {
  return {
    id: 5,
    name: "Fetch the herb",
    description: "Bring back a herb.",
    quest_type: "fetch",
    fetch_item: itemRow(),
    defeat_enemy_id: null,
    explore_room: null,
    explore_room_id: null,
    objectives: null,
    rewards: null,
    ...overrides,
  };
}

describe("mapDbEnemy", () => {
  it("maps snake_case rows and applies defaults", () => {
    const mapped = mapDbEnemy(enemyRow());

    expect(mapped).toMatchObject({
      id: 3,
      name: "Goblin",
      health: 8,
      strength: 2,
      dex: 3,
      defense: 1,
      img: "/goblin.png",
      expGain: 10,
      type: "enemy",
    });
    expect(mapped.maxHealth).toBeUndefined();
    expect(mapped.phase).toBeUndefined();
    expect(mapped.moves).toBeUndefined();
    expect(mapped.spawns).toBeUndefined();
  });

  it("keeps boss phase data and move lists", () => {
    const moves = [
      {
        name: "Slam",
        description: "A heavy blow",
        cooldown: 2,
        weight: 1,
        effect: { type: "damage" as const, target: "single" as const },
      },
    ];

    const mapped = mapDbEnemy(
      enemyRow({
        health: 60,
        max_health: 60,
        type: "boss",
        phase_thresholds: [50],
        moves,
      }),
    );

    expect(mapped.maxHealth).toBe(60);
    expect(mapped.phase).toBe(1);
    expect(mapped.phaseThresholds).toEqual([50]);
    expect(mapped.moves).toEqual(moves);
  });
});

describe("mapDbItem", () => {
  it("returns null when the row is missing", () => {
    expect(mapDbItem(null)).toBeNull();
    expect(mapDbItem(undefined)).toBeNull();
  });

  it("maps consumables with defaults for nullable columns", () => {
    const mapped = mapDbItem(itemRow());

    expect(mapped).toEqual({
      name: "Health Potion",
      value: 2,
      img: "/potion.png",
      cost: 3,
      type: "consumable",
      effect: "",
      hpChange: 0,
      manaChange: 0,
      target: "single",
      stackSize: undefined,
    });
  });

  it("maps equipment stats and actions", () => {
    const mapped = mapDbItem(
      itemRow({
        name: "Spear",
        type: "equipment",
        slot: "weapon",
        stats: { attack: 3 },
      }),
    );

    expect(mapped).toMatchObject({
      name: "Spear",
      type: "equipment",
      slot: "weapon",
      stats: { attack: 3 },
    });
    expect(mapped && "action" in mapped && mapped.action).toBeUndefined();
  });
});

describe("mapDbQuest", () => {
  it("maps a fetch quest with objectives and rewards", async () => {
    const mapped = await mapDbQuest(
      questRow({
        objectives: [{ objective: "Find the herb" }],
        rewards: [{ item: itemRow() }, { item: null }],
      }),
    );

    expect(mapped.name).toBe("Fetch the herb");
    expect(mapped.type).toMatchObject({
      type: "fetch",
      item: { name: "Health Potion" },
    });
    expect(mapped.objectives).toEqual(["Find the herb"]);
    expect(mapped.rewards).toHaveLength(1);
    expect(mapped.accepted).toBe(false);
    expect(mapped.completed).toBe(false);
  });

  it("maps explore quests to room objects", async () => {
    const mapped = await mapDbQuest(
      questRow({
        quest_type: "explore",
        explore_room: { id: 9, name: "Cave", section_id: 2 },
      }),
    );

    expect(mapped.type).toEqual({
      type: "explore",
      requireRoom: {
        id: 9,
        name: "Cave",
        sectionId: 2,
        enemies: [],
        neighboringRooms: [],
        interaction: null,
      },
    });
  });
});
