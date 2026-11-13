import type { DbItem } from "@/queries/RoomQueries";

/**
 * Canonical item rows used to seed a fresh database and as a fallback when the
 * items table is empty. Image values are stable keys resolved by
 * `resolveItemImage` rather than hashed build URLs.
 */
export type ItemSeedRow = Omit<DbItem, "id"> & { id?: string };

export const DEFAULT_ITEM_ROWS: ItemSeedRow[] = [
  {
    name: "Health Potion",
    value: 2,
    img: "health-potion.png",
    type: "consumable",
    effect: "You are healed 3 hp",
    hp_change: 3,
    mana_change: 0,
    stack_size: null,
    slot: null,
    attack: null,
    defense: null,
  },
  {
    name: "Mana Potion",
    value: 2,
    img: "mana-potion.png",
    type: "consumable",
    effect: "You are healed 3 mana",
    hp_change: 0,
    mana_change: 3,
    stack_size: null,
    slot: null,
    attack: null,
    defense: null,
  },
  {
    name: "Shortsword",
    value: 5,
    img: "sword.png",
    type: "equipment",
    effect: "A reliable one-handed blade.",
    hp_change: null,
    mana_change: null,
    stack_size: null,
    slot: "weapon",
    attack: 2,
    defense: null,
  },
  {
    name: "Staff",
    value: 5,
    img: "staff.png",
    type: "equipment",
    effect: "A spellcaster's focus.",
    hp_change: null,
    mana_change: null,
    stack_size: null,
    slot: "weapon",
    attack: 1,
    defense: null,
  },
  {
    name: "Spear",
    value: 6,
    img: "spear.png",
    type: "equipment",
    effect: "Reach and power in one weapon.",
    hp_change: null,
    mana_change: null,
    stack_size: null,
    slot: "weapon",
    attack: 3,
    defense: null,
  },
  {
    name: "Longbow",
    value: 7,
    img: "bow-v1.png",
    type: "equipment",
    effect: "Strikes from a safe distance.",
    hp_change: null,
    mana_change: null,
    stack_size: null,
    slot: "weapon",
    attack: 3,
    defense: null,
  },
];
