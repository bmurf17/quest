import hpImg from "../assets/health-potion.png"
import manaImg from "../assets/mana-potion.png"
import sword from "../assets/Sword.png"
import staff from "../assets/Staff.png"
import spear from "../assets/Spear.png"
import longbow from "../assets/BowV1.png"

export type DamageDice = {
  numDice: number;
  dieSize: number;
  bonus: number;
};

export type Action = {
  name: string;
  hitDC: string;
  damage: DamageDice;
  type: "Ranged Weapon" | "Melee Weapon";
};

export type BaseItem = {
  name: string;
  value: number;
  img: string
  cost: number;
};

export type Consumable = BaseItem & {
  type: 'consumable';
  effect: string;
  hpChange: number;
  manaChange: number;
  stackSize?: number;
};

export type EquipmentSlot = 'helmet' | 'armor' | 'weapon' | 'shield' | 'accessory' | 'boots';

export type EquippableItem = BaseItem & {
  type: 'equipment';
  slot: EquipmentSlot;
  stats: {
    attack?: number;
    defense?: number;
  };
  action?: Action;
};

export type Item = Consumable | EquippableItem;

export const healthPotion: Consumable = {
    name: 'Health Potion',
    value: 2,
    img: hpImg,
    effect: "You are healed 3 hp",
    type: "consumable",
    hpChange: 3,
    manaChange: 0,
    cost: 3
}

export const manaPotion: Consumable = {
    name: 'Mana Potion',
    value: 2,
    img: manaImg,
    effect: "You are healed 3 mana",
    type: "consumable",
    hpChange: 0,
    manaChange: 3,
    cost: 3
}

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
