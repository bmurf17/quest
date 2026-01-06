import warrior from "../assets/Warrior.png";
import rogue from "../assets/Rogue.png";
import longbow from "../assets/BowV1.png";
import staff from "../assets/Staff.png";
import sword from "../assets/Sword.png";
import spear from "../assets/Spear.png"
import cleric from "../assets/Cleric.png";
import wizard from "../assets/Wizard.png";
import assasin from "../assets/Assassin.png";

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

type Item = {
  img: string;
  action: Action;
};

export type CharacterData = {
  name: string;
  race: string;
  img: string;
  class: string;
  level: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  abilities: AbilityScores;
  skills: Skill[];
  items: Item[];
  savingThrows: SavingThrows;
  type: 'character'
};

export const tempRanger: CharacterData = {
  name: "Ranger Example",
  race: "Human",
  img: rogue,
  class: "Ranger",
  level: 2,
  hp: 15,
  maxHp: 15,
  mp: 10,
  maxMp: 10,
  abilities: {
    str: { score: 11, modifier: 0 },
    dex: { score: 17, modifier: 2 },
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
  items: [
    {
      img: longbow,
      action: {
        name: "Longbow",
        hitDC: "+6",
        damage: "1d8+2",
        type: "Ranged Weapon",
      },
    },
    {
      img: sword,
      action: {
        name: "Shortsword",
        hitDC: "+4",
        damage: "1d6+2",
        type: "Melee Weapon",
      },
    },
  ],
  savingThrows: {
    str: "+2",
    dex: "+4",
    con: "0",
    int: "+1",
    wis: "+1",
    cha: "-1",
  },
  type: "character"
};

export const tempWarrior: CharacterData = {
  name: "Warrior Example",
  race: "Human",
  img: warrior,
  class: "Warrior",
  level: 2,
  hp: 20,
  maxHp: 20,
  mp: 5,
  maxMp: 5,
  abilities: {
    str: { score: 15, modifier: 0 },
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
  items: [
    {
      img: spear,
      action: {
        name: "Spear",
        hitDC: "+6",
        damage: "1d8+2",
        type: "Melee Weapon",
      },
    },
    {
      img: sword,
      action: {
        name: "Shortsword",
        hitDC: "+4",
        damage: "1d6+2",
        type: "Melee Weapon",
      },
    },
  ],
  savingThrows: {
    str: "+2",
    dex: "+4",
    con: "0",
    int: "+1",
    wis: "+1",
    cha: "-1",
  },
  type: "character"
};

export const tempCleric: CharacterData = {
  name: "Cleric Example",
  race: "Human",
  img: cleric,
  class: "Cleric",
  level: 2,
  hp: 12,
  maxHp: 12,
  mp: 15,
  maxMp: 15,
  abilities: {
    str: { score: 8, modifier: 0 },
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
  items: [
    {
      img: staff,
      action: {
        name: "staff",
        hitDC: "+1",
        damage: "1d4+2",
        type: "Ranged Weapon",
      },
    },
    {
      img: sword,
      action: {
        name: "Shortsword",
        hitDC: "+4",
        damage: "1d6+2",
        type: "Melee Weapon",
      },
    },
  ],
  savingThrows: {
    str: "+2",
    dex: "+4",
    con: "0",
    int: "+1",
    wis: "+1",
    cha: "-1",
  },
  type: "character"
};

export const tempWizard: CharacterData = {
  name: "Wizard Example",
  race: "Human",
  img: wizard,
  class: "Wizard",
  level: 2,
  hp: 10,
  maxHp: 10,
  mp: 20,
  maxMp: 20,
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
  items: [
    {
      img: staff,
      action: {
        name: "Staff",
        hitDC: "+6",
        damage: "1d8+2",
        type: "Ranged Weapon",
      },
    },
    {
      img: sword,
      action: {
        name: "Shortsword",
        hitDC: "+4",
        damage: "1d6+2",
        type: "Melee Weapon",
      },
    },
  ],
  savingThrows: {
    str: "+2",
    dex: "+4",
    con: "0",
    int: "+1",
    wis: "+1",
    cha: "-1",
  },
  type: "character"
};

export const tempAssassin: CharacterData = {
  name: "Assassin Example",
  race: "Human",
  img: assasin,
  class: "Assassin",
  level: 2,
  hp: 15,
  maxHp: 15,
  mp: 10,
  maxMp: 10,
  abilities: {
    str: { score: 11, modifier: 0 },
    dex: { score: 17, modifier: 2 },
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
  items: [
    {
      img: longbow,
      action: {
        name: "Longbow",
        hitDC: "+6",
        damage: "1d8+2",
        type: "Ranged Weapon",
      },
    },
    {
      img: sword,
      action: {
        name: "Shortsword",
        hitDC: "+4",
        damage: "1d6+2",
        type: "Melee Weapon",
      },
    },
  ],
  savingThrows: {
    str: "+2",
    dex: "+4",
    con: "0",
    int: "+1",
    wis: "+1",
    cha: "-1",
  },
  type: "character"
};
