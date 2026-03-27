import warrior from "../assets/Warrior.png";
import rogue from "../assets/Rogue.png";
import longbow from "../assets/BowV1.png";
import staff from "../assets/Staff.png";
import sword from "../assets/Sword.png";
import spear from "../assets/Spear.png";
import cleric from "../assets/Cleric.png";
import wizard from "../assets/Wizard.png";
import bard from "../assets/Bard.png";
import barbarian from "../assets/Barbarian.png";
import assassin from "../assets/Assassin.png";
import fireball from "/images/spells/fireball.png";
import heal from "/images/spells/heal.png";
import { Spell } from "./Spell";

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
  def: Ability;
};

type Skill = {
  name: string;
  ability: "STR" | "DEX" | "CON" | "INT" | "WIS" | "CHA";
  modifier: string;
};

export type DamageDice = {
  numDice: number;
  dieSize: number;
  bonus: number;
};

export function rollDamageDice(dice: DamageDice): number {
  let total = 0;
  for (let i = 0; i < dice.numDice; i++) {
    total += Math.floor(Math.random() * dice.dieSize) + 1;
  }
  return total + dice.bonus;
}

export function formatDamageDice(dice: DamageDice): string {
  return `${dice.numDice}d${dice.dieSize}${dice.bonus >= 0 ? '+' : ''}${dice.bonus}`;
}

type Action = {
  name: string;
  hitDC: string;
  damage: DamageDice;
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
  spells: Spell[];
  type: "character";
  alive: boolean;
  exp: number;
  nextLevelExp: number;
};

const defaultSavingThrows: SavingThrows = {
  str: "+2",
  dex: "+4",
  con: "0",
  int: "+1",
  wis: "+1",
  cha: "-1",
};

const defaultSpells: Spell[] = [
  {
    name: "Fireball",
    manaCost: 5,
    image: fireball,
    effect: { type: 'damage', amount: 15, target: 'single' },
    description: "Hurls a blazing fireball at an enemy"
  },
  {
    name: "Heal",
    manaCost: 3,
    image: heal,
    effect: { type: 'heal', amount: 20, target: 'single' },
    description: "Restores health to a party member"
  },
];

const defaultSkills: Skill[] = [
  { name: "Acrobatics", ability: "DEX", modifier: "+2" },
  { name: "Animal Handling", ability: "WIS", modifier: "+1" },
  { name: "Arcana", ability: "INT", modifier: "+1" },
  { name: "Athletics", ability: "STR", modifier: "+2" },
  { name: "Deception", ability: "CHA", modifier: "-1" },
];

const shortswordItem: Item = {
  img: sword,
  action: {
    name: "Shortsword",
    hitDC: "+4",
    damage: { numDice: 1, dieSize: 6, bonus: 2 },
    type: "Melee Weapon",
  },
};

const staffItem: Item = {
  img: staff,
  action: {
    name: "Staff",
    hitDC: "+6",
    damage: { numDice: 1, dieSize: 8, bonus: 2 },
    type: "Ranged Weapon",
  },
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
    def: { score: 12, modifier: 1 },
  },
  skills: [
    { name: "Acrobatics", ability: "DEX", modifier: "+2" },
    { name: "Arcana", ability: "INT", modifier: "+1" },
    { name: "Athletics", ability: "STR", modifier: "+2" },
    { name: "Deception", ability: "CHA", modifier: "-1" },
  ],
  items: [staffItem, shortswordItem],
  savingThrows: defaultSavingThrows,
  spells: defaultSpells,
  type: "character",
  alive: true,
  exp: 0,
  nextLevelExp: 50
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
    def: { score: 12, modifier: 1 },
  },
  skills: defaultSkills,
  items: [
    {
      img: spear,
      action: {
        name: "Spear",
        hitDC: "+6",
        damage: { numDice: 1, dieSize: 8, bonus: 2 },
        type: "Melee Weapon",
      },
    },
    shortswordItem,
  ],
  savingThrows: defaultSavingThrows,
  type: "character",
  alive: true,
  spells: defaultSpells,
  exp: 0,
  nextLevelExp: 50
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
    int: { score: 15, modifier: 1 },
    wis: { score: 15, modifier: 1 },
    cha: { score: 12, modifier: 1 },
    def: { score: 15, modifier: 1 },
  },
  skills: defaultSkills,
  items: [
    {
      img: staff,
      action: {
        name: "staff",
        hitDC: "+1",
        damage: { numDice: 1, dieSize: 4, bonus: 2 },
        type: "Ranged Weapon",
      },
    },
    shortswordItem,
  ],
  savingThrows: defaultSavingThrows,
  type: "character",
  alive: true,
  spells: defaultSpells,
  exp: 0,
  nextLevelExp: 50
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
    wis: { score: 17, modifier: 1 },
    cha: { score: 17, modifier: 1 },
    def: { score: 12, modifier: 1 },
  },
  skills: defaultSkills,
  items: [staffItem, shortswordItem],
  savingThrows: defaultSavingThrows,
  type: "character",
  alive: true,
  spells: defaultSpells,
  exp: 0,
  nextLevelExp: 50
};

export const tempAssassin: CharacterData = {
  name: "Assassin Example",
  race: "Human",
  img: assassin,
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
    def: { score: 12, modifier: 1 },
  },
  skills: defaultSkills,
  items: [
    {
      img: longbow,
      action: {
        name: "Longbow",
        hitDC: "+6",
        damage: { numDice: 1, dieSize: 8, bonus: 2 },
        type: "Ranged Weapon",
      },
    },
    shortswordItem,
  ],
  savingThrows: defaultSavingThrows,
  type: "character",
  alive: true,
  spells: defaultSpells,
  exp: 0,
  nextLevelExp: 50
};


export const tempBarbarian: CharacterData = {
  name: "Barbarian Example",
  race: "Ogre",
  img: barbarian,
  class: "Barbarian",
  level: 2,
  hp: 20,
  maxHp: 20,
  mp: 5,
  maxMp: 5,
  abilities: {
    str: { score: 18, modifier: 0 },
    dex: { score: 15, modifier: 2 },
    con: { score: 10, modifier: 0 },
    int: { score: 12, modifier: 1 },
    wis: { score: 12, modifier: 1 },
    cha: { score: 12, modifier: 1 },
    def: { score: 14, modifier: 1 },
  },
  skills: defaultSkills,
  items: [staffItem, shortswordItem],
  savingThrows: defaultSavingThrows,
  type: "character",
  alive: true,
  spells: defaultSpells,
  exp: 0,
  nextLevelExp: 50
};

export const tempBard: CharacterData = {
  name: "Bard Example",
  race: "Tiefling",
  img: bard,
  class: "Bard",
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
    def: { score: 12, modifier: 1 },
  },
  skills: defaultSkills,
  items: [staffItem, shortswordItem],
  savingThrows: defaultSavingThrows,
  type: "character",
  alive: true,
  spells: defaultSpells,
  exp: 0,
  nextLevelExp: 50
};
