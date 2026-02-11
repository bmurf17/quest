import hpImg from "../assets/health-potion.png"
import manaImg from "../assets/mana-potion.png"

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

export type Equipment = BaseItem & {
  type: 'equipment';
  slot: 'weapon' | 'armor' | 'accessory';
  stats: {
    attack?: number;
    defense?: number;
  };
};

export type Item = Consumable | Equipment;

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