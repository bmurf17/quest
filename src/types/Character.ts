type Ability = {
  score: number;
  modifier: number;
};

type AbilityScores = {
  str: Ability;
  dex: Ability;
  con: Ability;
  int: Ability;
  wis: Ability;
  cha: Ability;
};

type Skill = {
  name: string;
  ability: "STR" | "DEX" | "CON" | "INT" | "WIS" | "CHA";
  modifier: string;
};

type Action = {
  name: string;
  hitDC: string;
  damage: string;
  type: "Ranged Weapon" | "Melee Weapon";
};

type SavingThrows = {
  str: string;
  dex: string;
  con: string;
  int: string;
  wis: string;
  cha: string;
};

export type CharacterData = {
  name: string;
  race: string;
  class: string;
  level: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  abilities: AbilityScores;
  skills: Skill[];
  actions: Action[];
  savingThrows: SavingThrows;
};

export const tempChar: CharacterData = {
  name: "Ranger Example",
  race: "Human",
  class: "Ranger",
  level: 2,
  hp: 16,
  maxHp: 16,
  mp: 8,
  maxMp: 10,
  abilities: {
    str: { score: 11, modifier: 0 },
    dex: { score: 15, modifier: 2 },
    con: { score: 10, modifier: 0 },
    int: { score: 12, modifier: 1 },
    wis: { score: 12, modifier: 1 },
    cha: { score: 12, modifier: 1 },
  },
  skills: [
    { name: "Acrobatics", ability: "DEX", modifier: "+2" },
    { name: "Animal Handling", ability: "WIS", modifier: "+1" },
    { name: "Arcana", ability: "INT", modifier: "+1" },
    { name: "Athletics", ability: "STR", modifier: "+2" },
    { name: "Deception", ability: "CHA", modifier: "-1" },
  ],
  actions: [
    { name: "Longbow", hitDC: "+6", damage: "1d8+2", type: "Ranged Weapon" },
    { name: "Shortsword", hitDC: "+4", damage: "1d6+2", type: "Melee Weapon" },
  ],
  savingThrows: {
    str: "+2",
    dex: "+4",
    con: "0",
    int: "+1",
    wis: "+1",
    cha: "-1",
  },
};
