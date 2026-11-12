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
  img: string;
  cost: number;
  description?: string;
};

export type Consumable = BaseItem & {
  type: "consumable";
  effect: string;
  hpChange: number;
  manaChange: number;
  target: "single" | "all";
  stackSize?: number;
};

export type EquipmentSlot =
  | "helmet"
  | "armor"
  | "weapon"
  | "shield"
  | "accessory"
  | "boots";

export type EquippableItem = BaseItem & {
  type: "equipment";
  slot: EquipmentSlot;
  stats: {
    attack?: number;
    defense?: number;
  };
  action?: Action;
};

export type Item = Consumable | EquippableItem;
