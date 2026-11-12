import type { Spell } from "./Spell";
import type { EquippableItem } from "./Item";

export type Ability = {
  score: number;
  modifier: number;
};

export type AbilityScores = {
  str: Ability;
  dex: Ability;
  con: Ability;
  int: Ability;
  wis: Ability;
  cha: Ability;
  def: Ability;
};

export type Skill = {
  name: string;
  ability: "STR" | "DEX" | "CON" | "INT" | "WIS" | "CHA";
  modifier: string;
};

export type SavingThrows = {
  str: string;
  dex: string;
  con: string;
  int: string;
  wis: string;
  cha: string;
};

export type CharacterEquipment = {
  helmet: EquippableItem | null;
  armor: EquippableItem | null;
  weapon: EquippableItem | null;
  shield: EquippableItem | null;
  accessory1: EquippableItem | null;
  accessory2: EquippableItem | null;
  boots: EquippableItem | null;
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
  equipment: CharacterEquipment;
  savingThrows: SavingThrows;
  spells: Spell[];
  type: "character";
  alive: boolean;
  exp: number;
  nextLevelExp: number;
};
