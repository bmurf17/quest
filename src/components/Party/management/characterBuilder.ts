import type { CharacterData } from "@/types/Character";
import type { Spell } from "@/types/Spell";
import { MAX_SCORE, POINT_BUDGET } from "@/consts/constants";
import { abilityModifier, totalAbilityPointsSpent } from "@/lib/character";
import type { useCharacter } from "@/components/CharacterCreation/CharacterContext";
import { type Character } from "@/components/CharacterCreation/CharacterContext";

import warriorImg from "@/assets/warrior.png";
import rogueImg from "@/assets/rogue.png";
import rogue1Img from "@/assets/rogue-1.png";
import clericImg from "@/assets/cleric.png";
import wizardImg from "@/assets/wizard.png";
import bardImg from "@/assets/bard.png";
import barbarianImg from "@/assets/barbarian.png";
import assassinImg from "@/assets/assassin.png";
import swordImg from "@/assets/sword.png";

export const MAX_PARTY_SIZE = 6;

const IMAGE_SRC: Record<string, string> = {
  warrior: warriorImg,
  rogue: rogueImg,
  "rogue-1": rogue1Img,
  cleric: clericImg,
  wizard: wizardImg,
  bard: bardImg,
  barbarian: barbarianImg,
  assassin: assassinImg,
};

const CLASS_HP: Record<string, number> = {
  barbarian: 18,
  bard: 8,
  cleric: 10,
  druid: 8,
  fighter: 12,
};

const CLASS_MP: Record<string, number> = {
  barbarian: 4,
  bard: 8,
  cleric: 8,
  druid: 10,
  fighter: 6,
};

const defaultSpells: Spell[] = [
  {
    name: "Fireball",
    manaCost: 5,
    image: "/images/spells/fireball.png",
    effect: { type: "damage", amount: 15, target: "single" },
    description: "Hurls a blazing fireball at an enemy",
  },
  {
    name: "Heal",
    manaCost: 3,
    image: "/images/spells/heal.png",
    effect: { type: "heal", amount: 20, target: "single" },
    description: "Restores health to a party member",
  },
];

export function canCreateCharacter(character: Character): boolean {
  return Boolean(
    character.name.trim() &&
    character.race &&
    character.class &&
    character.image &&
    Object.values(character.abilities).every((value) => value >= 1 && value <= MAX_SCORE) &&
    totalAbilityPointsSpent(character.abilities) === POINT_BUDGET,
  );
}

export function buildCharacter(
  context: ReturnType<typeof useCharacter>["character"],
): CharacterData {
  const cls = context.class || "fighter";
  return {
    name: context.name || "Adventurer",
    race: context.race || "human",
    img: IMAGE_SRC[context.image] || IMAGE_SRC.warrior || "/placeholder.svg",
    class: cls.charAt(0).toUpperCase() + cls.slice(1),
    level: 1,
    hp: CLASS_HP[cls] || 10,
    maxHp: CLASS_HP[cls] || 10,
    mp: CLASS_MP[cls] || 6,
    maxMp: CLASS_MP[cls] || 6,
    abilities: {
      str: {
        score: context.abilities.strength,
        modifier: abilityModifier(context.abilities.strength),
      },
      dex: {
        score: context.abilities.dexterity,
        modifier: abilityModifier(context.abilities.dexterity),
      },
      con: {
        score: context.abilities.constitution,
        modifier: abilityModifier(context.abilities.constitution),
      },
      int: {
        score: context.abilities.intelligence,
        modifier: abilityModifier(context.abilities.intelligence),
      },
      wis: {
        score: context.abilities.wisdom,
        modifier: abilityModifier(context.abilities.wisdom),
      },
      cha: {
        score: context.abilities.charisma,
        modifier: abilityModifier(context.abilities.charisma),
      },
      def: {
        score: context.abilities.defense,
        modifier: abilityModifier(context.abilities.defense),
      },
    },
    skills: [
      { name: "Acrobatics", ability: "DEX", modifier: "+2" },
      { name: "Animal Handling", ability: "WIS", modifier: "+1" },
      { name: "Arcana", ability: "INT", modifier: "+1" },
      { name: "Athletics", ability: "STR", modifier: "+2" },
      { name: "Deception", ability: "CHA", modifier: "-1" },
    ],
    equipment: {
      helmet: null,
      armor: null,
      weapon: {
        name: "Shortsword",
        value: 0,
        img: swordImg,
        cost: 0,
        type: "equipment",
        slot: "weapon",
        stats: {},
        action: {
          name: "Shortsword",
          hitDC: "+4",
          damage: { numDice: 1, dieSize: 6, bonus: 2 },
          type: "Melee Weapon",
        },
      },
      shield: null,
      accessory1: null,
      accessory2: null,
      boots: null,
    },
    savingThrows: {
      str: "+2",
      dex: "+4",
      con: "0",
      int: "+1",
      wis: "+1",
      cha: "-1",
    },
    spells: defaultSpells,
    type: "character",
    alive: true,
    exp: 0,
    nextLevelExp: 50,
  };
}
