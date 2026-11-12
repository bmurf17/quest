import { describe, expect, it } from "vitest";
import type { CharacterData } from "@/types/Character";
import { tempWarrior } from "@/data/fixtures/characters";
import type { Enemy } from "@/types/Enemy";
import { GameStatus } from "@/types/GameStatus";
import type { Consumable, EquippableItem } from "@/types/Item";
import { healthPotion, shortsword, staffWeapon } from "@/data/items";
import type { Room } from "@/types/Room";
import { Directions } from "@/types/Directions";
import {
  applyConsumable,
  equipItemInState,
  unequipItemInState,
} from "@/state/utils/InventoryUtils";
import { resolveMove } from "@/state/utils/WorldUtils";

function character(overrides: Partial<CharacterData> = {}): CharacterData {
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
    id: 10,
    name: "Goblin",
    health: 10,
    strength: 4,
    dex: 4,
    defense: 10,
    img: "",
    expGain: 5,
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

describe("applyConsumable", () => {
  it("heals the target and removes one item from the inventory", () => {
    const hero = character({ hp: 10, maxHp: 20, mp: 1, maxMp: 10 });
    const result = applyConsumable(
      {
        party: [hero],
        combatOrder: [],
        inventory: [healthPotion, healthPotion],
        gameStatus: GameStatus.Exploring,
        activeFighterIndex: 0,
      },
      healthPotion,
      hero,
    );

    expect(result.party[0].hp).toBe(13);
    expect(result.inventory).toHaveLength(1);
    expect(result.activityLog).toEqual([healthPotion.effect]);
  });

  it("revives a defeated member and adds them back to the combat order", () => {
    const fallen = character({ hp: 0, alive: false });
    const potion: Consumable = { ...healthPotion, hpChange: 5 };
    const result = applyConsumable(
      {
        party: [fallen],
        combatOrder: [],
        inventory: [potion],
        gameStatus: GameStatus.Combat,
        activeFighterIndex: 0,
      },
      potion,
      fallen,
    );

    expect(result.party[0].hp).toBe(5);
    expect(result.party[0].alive).toBe(true);
    expect(result.combatOrder.map((f) => f.name)).toContain(fallen.name);
  });
});

describe("equipItemInState", () => {
  it("equips an item and removes it from the inventory", () => {
    const result = equipItemInState(
      { party: [character()], inventory: [shortsword] },
      tempWarrior.name,
      shortsword.name,
    );

    expect(result).not.toBeNull();
    expect(result!.party[0].equipment.weapon).toBe(shortsword);
    expect(result!.inventory).toHaveLength(0);
    expect(result!.log[0]).toMatch(/equipped Shortsword/);
  });

  it("returns the previously equipped item to the inventory", () => {
    const hero = character();
    hero.equipment.weapon = shortsword;

    const result = equipItemInState(
      { party: [hero], inventory: [staffWeapon] },
      tempWarrior.name,
      staffWeapon.name,
    );

    expect(result!.party[0].equipment.weapon).toBe(staffWeapon);
    expect(result!.inventory).toContain(shortsword);
  });

  it("returns null for a missing character instead of losing the item", () => {
    const result = equipItemInState(
      { party: [character()], inventory: [shortsword] },
      "Nobody",
      shortsword.name,
    );
    expect(result).toBeNull();
  });
});

describe("unequipItemInState", () => {
  it("moves the equipped item into the inventory", () => {
    const hero = character();
    hero.equipment.weapon = shortsword as EquippableItem;

    const result = unequipItemInState(
      { party: [hero], inventory: [] },
      tempWarrior.name,
      "weapon",
    );

    expect(result!.party[0].equipment.weapon).toBeNull();
    expect(result!.inventory).toContain(shortsword);
  });
});

describe("resolveMove", () => {
  it("returns null when there is no room in that direction", () => {
    const start = room();
    expect(
      resolveMove(
        {
          room: start,
          roomInstances: new Map([[start.id, start]]),
          party: [character()],
          combatOrder: [],
          activityLog: [],
          enemyCooldowns: new Map(),
          activeBuffs: new Map(),
        },
        Directions.North,
      ),
    ).toBeNull();
  });

  it("moves to a neighboring room and starts combat when enemies are present", () => {
    const goblin = enemy();
    const north = room({ id: 2, name: "North", enemies: [goblin] });
    const start = room({
      neighboringRooms: [[Directions.North, north]],
    });
    const hero = character();

    const updates = resolveMove(
      {
        room: start,
        roomInstances: new Map([[start.id, start]]),
        party: [hero],
        combatOrder: [],
        activityLog: [],
        enemyCooldowns: new Map(),
        activeBuffs: new Map(),
      },
      Directions.North,
    );

    expect(updates!.room?.id).toBe(2);
    expect(updates!.gameStatus).toBe(GameStatus.Combat);
    expect(updates!.combatOrder).toHaveLength(2);
    // The instance is cloned, not shared with the template.
    expect(updates!.room).not.toBe(north);
  });
});
