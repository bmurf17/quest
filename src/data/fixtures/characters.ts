import warrior from "@/assets/warrior.png";
import rogue from "@/assets/rogue.png";
import cleric from "@/assets/cleric.png";
import wizard from "@/assets/wizard.png";
import bard from "@/assets/bard.png";
import barbarian from "@/assets/barbarian.png";
import assassin from "@/assets/assassin.png";
import fireball from "/images/spells/fireball.png";
import heal from "/images/spells/heal.png";
import type { CharacterData, CharacterEquipment, Skill } from "@/types/Character";
import type { Spell } from "@/types/Spell";
import { longbowWeapon, shortsword, spearWeapon, staffWeapon } from "@/data/items";

const defaultSavingThrows = {
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
    effect: { type: "damage", amount: 15, target: "single" },
    description: "Hurls a blazing fireball at an enemy",
  },
  {
    name: "Heal",
    manaCost: 3,
    image: heal,
    effect: { type: "heal", amount: 20, target: "single" },
    description: "Restores health to a party member",
  },
];

const defaultSkills: Skill[] = [
  { name: "Acrobatics", ability: "DEX", modifier: "+2" },
  { name: "Animal Handling", ability: "WIS", modifier: "+1" },
  { name: "Arcana", ability: "INT", modifier: "+1" },
  { name: "Athletics", ability: "STR", modifier: "+2" },
  { name: "Deception", ability: "CHA", modifier: "-1" },
];

const noEquipment: CharacterEquipment = {
  helmet: null,
  armor: null,
  weapon: null,
  shield: null,
  accessory1: null,
  accessory2: null,
  boots: null,
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
  equipment: { ...noEquipment, weapon: longbowWeapon },
  savingThrows: defaultSavingThrows,
  spells: defaultSpells,
  type: "character",
  alive: true,
  exp: 0,
  nextLevelExp: 50,
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
  equipment: { ...noEquipment, weapon: spearWeapon },
  savingThrows: defaultSavingThrows,
  type: "character",
  alive: true,
  spells: defaultSpells,
  exp: 0,
  nextLevelExp: 50,
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
  equipment: {
    ...noEquipment,
    weapon: {
      ...staffWeapon,
      action: {
        ...staffWeapon.action!,
        name: "staff",
        hitDC: "+1",
        damage: { numDice: 1, dieSize: 4, bonus: 2 },
      },
    },
  },
  savingThrows: defaultSavingThrows,
  type: "character",
  alive: true,
  spells: defaultSpells,
  exp: 0,
  nextLevelExp: 50,
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
  equipment: { ...noEquipment, weapon: staffWeapon },
  savingThrows: defaultSavingThrows,
  type: "character",
  alive: true,
  spells: defaultSpells,
  exp: 0,
  nextLevelExp: 50,
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
  equipment: { ...noEquipment, weapon: longbowWeapon },
  savingThrows: defaultSavingThrows,
  type: "character",
  alive: true,
  spells: defaultSpells,
  exp: 0,
  nextLevelExp: 50,
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
  equipment: { ...noEquipment, weapon: staffWeapon },
  savingThrows: defaultSavingThrows,
  type: "character",
  alive: true,
  spells: defaultSpells,
  exp: 0,
  nextLevelExp: 50,
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
  equipment: { ...noEquipment, weapon: shortsword },
  savingThrows: defaultSavingThrows,
  type: "character",
  alive: true,
  spells: defaultSpells,
  exp: 0,
  nextLevelExp: 50,
};
