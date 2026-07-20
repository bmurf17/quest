import { CharacterData } from "@/types/Character";
import { EquippableItem } from "@/types/Item";
import { TavernConfig } from "@/types/Tavern";
import { Spell } from "@/types/Spell";

import warriorImg from "@/assets/Warrior.png";
import rogueImg from "@/assets/Rogue.png";
import clericImg from "@/assets/Cleric.png";
import wizardImg from "@/assets/Wizard.png";
import bardImg from "@/assets/Bard.png";
import barbarianImg from "@/assets/Barbarian.png";
import assassinImg from "@/assets/Assassin.png";
import swordImg from "@/assets/Sword.png";
import staffImg from "@/assets/Staff.png";
import bowImg from "@/assets/BowV1.png";
import spearImg from "@/assets/Spear.png";

const CLASS_IMAGE: Record<string, string> = {
  warrior: warriorImg,
  ranger: rogueImg,
  cleric: clericImg,
  wizard: wizardImg,
  bard: bardImg,
  barbarian: barbarianImg,
  assassin: assassinImg,
};

const CLASS_HP: Record<string, number> = {
  barbarian: 14,
  bard: 8,
  cleric: 10,
  fighter: 12,
  ranger: 10,
  wizard: 8,
  assassin: 10,
  warrior: 12,
};

const CLASS_MP: Record<string, number> = {
  barbarian: 4,
  bard: 8,
  cleric: 8,
  fighter: 6,
  ranger: 8,
  wizard: 12,
  assassin: 6,
  warrior: 6,
};

const ALL_CLASSES = [
  "warrior",
  "ranger",
  "cleric",
  "wizard",
  "assassin",
  "barbarian",
  "bard",
] as const;

const FIRST_NAMES = [
  "Aria", "Borin", "Cedric", "Dorna", "Elara", "Finn", "Greta",
  "Havel", "Iris", "Jorin", "Kara", "Liam", "Mira", "Nash",
  "Oriana", "Pip", "Quinn", "Riva", "Soren", "Tara", "Ulric",
  "Vex", "Willow", "Xander", "Yara", "Zane",
];

const RACES = ["Human", "Elf", "Dwarf", "Halfling", "Gnome", "Half-Orc", "Tiefling"];

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

function roll(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function computeModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

function generateName(): string {
  const first = pick(FIRST_NAMES);
  const last = pick([
    "Shadow", "Ironheart", "Swiftarrow", "Battleborn", "Silvermoon",
    "Deepforge", "Stormwind", "Firebrand", "Nightwhisper", "Goldleaf",
  ]);
  return `${first} ${last}`;
}

const ABILITY_KEYS = ["str", "dex", "con", "int", "wis", "cha", "def"] as const;

const CLASS_STAT_WEIGHTS: Record<string, string[]> = {
  warrior: ["str", "dex", "def", "con", "wis", "cha", "int"],
  ranger: ["dex", "wis", "con", "str", "def", "int", "cha"],
  cleric: ["wis", "con", "cha", "dex", "str", "int", "def"],
  wizard: ["int", "wis", "dex", "con", "def", "cha", "str"],
  assassin: ["dex", "str", "int", "con", "def", "wis", "cha"],
  barbarian: ["str", "con", "dex", "def", "wis", "cha", "int"],
  bard: ["cha", "dex", "int", "wis", "con", "str", "def"],
};

function generateAbilities(config: TavernConfig, cls: string) {
  const base = 8;
  const scores: Record<string, number> = {};

  for (const key of ABILITY_KEYS) {
    scores[key] = base;
  }

  const weights = CLASS_STAT_WEIGHTS[cls] || CLASS_STAT_WEIGHTS.warrior;

  let remaining = config.statBonusPool;
  while (remaining > 0) {
    const roll = Math.random();
    let cumulative = 0;
    let picked = weights[0];
    for (let i = 0; i < weights.length; i++) {
      cumulative += 1 / (i + 1);
      if (roll < cumulative / weights.reduce((s, _, idx) => s + 1 / (idx + 1), 0)) {
        picked = weights[i];
        break;
      }
    }
    const maxStat = 18;
    if (scores[picked] < maxStat) {
      scores[picked]++;
      remaining--;
    }
  }

  const abilities = {} as CharacterData["abilities"];
  for (const key of ABILITY_KEYS) {
    abilities[key] = {
      score: scores[key],
      modifier: computeModifier(scores[key]),
    };
  }

  return abilities;
}

function generateLevel(config: TavernConfig): number {
  return roll(config.minLevel, config.maxLevel);
}

function classItem(cls: string): EquippableItem {
  const base = { type: 'equipment' as const, slot: 'weapon' as const, value: 2, cost: 3, stats: {} as { attack?: number; defense?: number } };
  switch (cls) {
    case "warrior":
    case "barbarian":
      return { ...base, name: "Spear", img: spearImg, action: { name: "Spear", hitDC: "+6", damage: { numDice: 1, dieSize: 8, bonus: 2 }, type: "Melee Weapon" as const } };
    case "ranger":
    case "assassin":
      return { ...base, name: "Longbow", img: bowImg, action: { name: "Longbow", hitDC: "+6", damage: { numDice: 1, dieSize: 8, bonus: 2 }, type: "Ranged Weapon" as const } };
    case "cleric":
    case "wizard":
    case "bard":
      return { ...base, name: "Staff", img: staffImg, action: { name: "Staff", hitDC: "+4", damage: { numDice: 1, dieSize: 6, bonus: 2 }, type: "Ranged Weapon" as const } };
    default:
      return { ...base, name: "Shortsword", img: swordImg, action: { name: "Shortsword", hitDC: "+4", damage: { numDice: 1, dieSize: 6, bonus: 2 }, type: "Melee Weapon" as const } };
  }
}

export function generateTavernCharacter(config: TavernConfig): CharacterData {
  const cls = pick(ALL_CLASSES);
  const level = generateLevel(config);
  const hpBonus = level > 1 ? (level - 1) * roll(5, 9) : 0;
  const mpBonus = level > 1 ? (level - 1) * roll(2, 6) : 0;

  const baseHp = CLASS_HP[cls] || 10;
  const baseMp = CLASS_MP[cls] || 6;

  return {
    name: generateName(),
    race: pick(RACES),
    img: CLASS_IMAGE[cls],
    class: cls.charAt(0).toUpperCase() + cls.slice(1),
    level,
    hp: baseHp + hpBonus,
    maxHp: baseHp + hpBonus,
    mp: baseMp + mpBonus,
    maxMp: baseMp + mpBonus,
    abilities: generateAbilities(config, cls),
    skills: [
      { name: "Acrobatics", ability: "DEX", modifier: "+2" },
      { name: "Animal Handling", ability: "WIS", modifier: "+1" },
      { name: "Arcana", ability: "INT", modifier: "+1" },
      { name: "Athletics", ability: "STR", modifier: "+2" },
      { name: "Deception", ability: "CHA", modifier: "-1" },
    ],
    equipment: {
      helmet: null, armor: null, weapon: classItem(cls),
      shield: null, accessory1: null, accessory2: null, boots: null,
    },
    savingThrows: {
      str: "+2", dex: "+4", con: "0", int: "+1", wis: "+1", cha: "-1",
    },
    spells: defaultSpells,
    type: "character",
    alive: true,
    exp: 0,
    nextLevelExp: 50,
  };
}

export function generateTavernCandidates(config: TavernConfig): CharacterData[] {
  const candidates: CharacterData[] = [];
  for (let i = 0; i < config.candidateCount; i++) {
    candidates.push(generateTavernCharacter(config));
  }
  return candidates;
}
