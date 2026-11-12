import type { CharacterData, CharacterEquipment } from "@/types/Character";
import type { Enemy } from "@/types/Enemy";
import type { GameStatus } from "@/types/GameStatus";
import { GameStatus as Status } from "@/types/GameStatus";
import type { Consumable, EquippableItem, Item } from "@/types/Item";
import { ActivityLogBuilder } from "./ActivityLogUtils";

/** State needed to apply a consumable. */
export type ConsumableState = {
  party: CharacterData[];
  combatOrder: (CharacterData | Enemy)[];
  inventory: Item[];
  gameStatus: GameStatus;
  activeFighterIndex: number;
};

export type ConsumableResult = {
  party: CharacterData[];
  combatOrder: (CharacterData | Enemy)[];
  inventory: Item[];
  activeFighterIndex: number;
  activityLog: string[];
};

/**
 * Apply a consumable to the party and remove it from the inventory.
 * Extracted from the store action so it can be tested without zustand.
 */
export function applyConsumable(
  state: ConsumableState,
  item: Consumable,
  target?: CharacterData,
): ConsumableResult {
  const log = new ActivityLogBuilder().add(`${item.effect}`);
  const newCombatOrder = [...state.combatOrder];

  const updatedParty = state.party.map((member) => {
    if (target && member.name !== target.name) return member;
    const wasDead = !member.alive || member.hp <= 0;
    const newHp = Math.min(member.maxHp, member.hp + item.hpChange);
    const newMp = Math.min(member.maxMp, member.mp + item.manaChange);
    const isNowAlive = newHp > 0;

    if (wasDead && isNowAlive) {
      const alreadyInOrder = newCombatOrder.find((f) => f.name === member.name);
      if (state.gameStatus === Status.Combat && !alreadyInOrder) {
        newCombatOrder.push({ ...member, hp: newHp, mp: newMp, alive: true });
      }
    }

    return {
      ...member,
      hp: newHp,
      mp: newMp,
      alive: isNowAlive,
    };
  });

  const itemIndex = state.inventory.findIndex((i) => i.name === item.name);
  const updatedInventory =
    itemIndex !== -1
      ? [
          ...state.inventory.slice(0, itemIndex),
          ...state.inventory.slice(itemIndex + 1),
        ]
      : state.inventory;

  const nextFighterIndex =
    state.gameStatus === Status.Combat
      ? (state.activeFighterIndex + 1) % newCombatOrder.length
      : state.activeFighterIndex;

  return {
    party: updatedParty,
    combatOrder: newCombatOrder,
    inventory: updatedInventory,
    activeFighterIndex: nextFighterIndex,
    activityLog: log.build(),
  };
}

type EquipmentState = {
  party: CharacterData[];
  inventory: Item[];
};

export type EquipmentResult = {
  party: CharacterData[];
  inventory: Item[];
  log: string[];
};

function resolveSlot(
  item: EquippableItem,
  equipment: CharacterEquipment,
): keyof CharacterEquipment {
  if (item.slot === "accessory") {
    return equipment.accessory1 ? "accessory2" : "accessory1";
  }
  return item.slot;
}

/** Equip an item from the inventory, returning the previous item to it. */
export function equipItemInState(
  state: EquipmentState,
  characterName: string,
  itemName: string,
): EquipmentResult | null {
  const itemIndex = state.inventory.findIndex(
    (i) => i.name === itemName && i.type === "equipment",
  );
  if (itemIndex === -1) return null;
  const item = state.inventory[itemIndex] as EquippableItem;

  const character = state.party.find((c) => c.name === characterName);
  if (!character) return null;

  const actualSlot = resolveSlot(item, character.equipment);
  const unequippedItem = character.equipment[actualSlot] ?? null;

  const updatedParty = state.party.map((char) => {
    if (char.name !== characterName) return char;
    return {
      ...char,
      equipment: { ...char.equipment, [actualSlot]: item },
    };
  });

  const updatedInventory = [...state.inventory];
  updatedInventory.splice(itemIndex, 1);
  if (unequippedItem) {
    updatedInventory.push(unequippedItem);
  }

  return {
    party: updatedParty,
    inventory: updatedInventory,
    log: [`${character.name} equipped ${item.name}.`],
  };
}

/** Unequip an item into the inventory. */
export function unequipItemInState(
  state: EquipmentState,
  characterName: string,
  slot: keyof CharacterEquipment,
): EquipmentResult | null {
  const character = state.party.find((c) => c.name === characterName);
  if (!character) return null;
  const item = character.equipment[slot];
  if (!item) return null;

  const updatedParty = state.party.map((c) =>
    c.name === characterName
      ? { ...c, equipment: { ...c.equipment, [slot]: null } }
      : c,
  );

  return {
    party: updatedParty,
    inventory: [...state.inventory, item],
    log: [`${character.name} unequipped ${item.name}.`],
  };
}
