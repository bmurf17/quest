import hpImg from "@/assets/health-potion.png";
import manaImg from "@/assets/mana-potion.png";
import sword from "@/assets/sword.png";
import staff from "@/assets/staff.png";
import spear from "@/assets/spear.png";
import longbow from "@/assets/bow-v1.png";
import type { Consumable, EquippableItem } from "@/types/Item";

export const healthPotion: Consumable = {
  name: "Health Potion",
  value: 2,
  img: hpImg,
  effect: "You are healed 3 hp",
  type: "consumable",
  hpChange: 3,
  manaChange: 0,
  target: "single",
  cost: 3,
};

export const manaPotion: Consumable = {
  name: "Mana Potion",
  value: 2,
  img: manaImg,
  effect: "You are healed 3 mana",
  type: "consumable",
  hpChange: 0,
  manaChange: 3,
  target: "single",
  cost: 3,
};

export const shortsword: EquippableItem = {
  name: "Shortsword",
  value: 2,
  img: sword,
  cost: 5,
  type: "equipment",
  slot: "weapon",
  stats: { attack: 2 },
  action: {
    name: "Shortsword",
    hitDC: "+4",
    damage: { numDice: 1, dieSize: 6, bonus: 2 },
    type: "Melee Weapon",
  },
};

export const staffWeapon: EquippableItem = {
  name: "Staff",
  value: 2,
  img: staff,
  cost: 5,
  type: "equipment",
  slot: "weapon",
  stats: { attack: 1 },
  action: {
    name: "Staff",
    hitDC: "+6",
    damage: { numDice: 1, dieSize: 8, bonus: 2 },
    type: "Ranged Weapon",
  },
};

export const spearWeapon: EquippableItem = {
  name: "Spear",
  value: 2,
  img: spear,
  cost: 6,
  type: "equipment",
  slot: "weapon",
  stats: { attack: 3 },
  action: {
    name: "Spear",
    hitDC: "+6",
    damage: { numDice: 1, dieSize: 8, bonus: 2 },
    type: "Melee Weapon",
  },
};

export const longbowWeapon: EquippableItem = {
  name: "Longbow",
  value: 2,
  img: longbow,
  cost: 7,
  type: "equipment",
  slot: "weapon",
  stats: { attack: 3 },
  action: {
    name: "Longbow",
    hitDC: "+6",
    damage: { numDice: 1, dieSize: 8, bonus: 2 },
    type: "Ranged Weapon",
  },
};
