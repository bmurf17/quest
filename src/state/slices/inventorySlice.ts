import type { CharacterData, CharacterEquipment } from "@/types/Character";
import {
  healthPotion,
} from "@/data/items";
import type { Consumable, Item } from "@/types/Item";
import { scheduleEnemyTurn } from "../utils/CombatUtils";
import {
  applyConsumable,
  equipItemInState,
  unequipItemInState,
} from "../utils/InventoryUtils";
import type { GameState, GameSlice } from "./types";

export type InventorySlice = Pick<
  GameState,
  | "inventory"
  | "goldPieces"
  | "consumeItem"
  | "buyItem"
  | "equipItem"
  | "unequipItem"
  | "targetingConsumable"
  | "setTargetingConsumable"
>;

export const createInventorySlice: GameSlice<InventorySlice> = (set, get) => ({
  inventory: [healthPotion],
  goldPieces: 5,
  targetingConsumable: null,

  setTargetingConsumable: (item: Consumable | null) =>
    set({ targetingConsumable: item }),

  consumeItem: (item: Consumable, target?: CharacterData) => {
    const state = get();
    const result = applyConsumable(state, item, target);

    set({
      party: result.party,
      combatOrder: result.combatOrder,
      inventory: result.inventory,
      activeFighterIndex: result.activeFighterIndex,
      activityLog: [...state.activityLog, ...result.activityLog],
    });

    scheduleEnemyTurn(get);
  },

  buyItem: (item: Item) =>
    set((state) => {
      if (item.cost > state.goldPieces) {
        return {
          activityLog: [
            ...state.activityLog,
            `Not enough gold to buy ${item.name}!`,
          ],
        };
      }

      return {
        inventory: [...state.inventory, item],
        goldPieces: state.goldPieces - item.cost,
      };
    }),

  equipItem: (characterName: string, itemName: string) => {
    const result = equipItemInState(get(), characterName, itemName);
    if (!result) return;
    set({ party: result.party, inventory: result.inventory });
    for (const message of result.log) {
      get().addToLog(message);
    }
  },

  unequipItem: (characterName: string, slot: keyof CharacterEquipment) => {
    const result = unequipItemInState(get(), characterName, slot);
    if (!result) return;
    set({ party: result.party, inventory: result.inventory });
    for (const message of result.log) {
      get().addToLog(message);
    }
  },
});
