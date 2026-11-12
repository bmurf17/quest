import { POINT_BUDGET } from "@/consts/constants";

/** Ability score before any points are allocated. */
export const ABILITY_BASE = 8;

export const ABILITY_KEYS = [
  "strength",
  "dexterity",
  "constitution",
  "intelligence",
  "wisdom",
  "charisma",
  "defense",
] as const;

export type AbilityKey = (typeof ABILITY_KEYS)[number];
export type AbilityScores = Record<AbilityKey, number>;

/** D&D-style ability modifier: +2 at 14, -1 at 8, etc. */
export function abilityModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

export function totalAbilityPointsSpent(abilities: AbilityScores): number {
  return ABILITY_KEYS.reduce((sum, key) => sum + (abilities[key] - ABILITY_BASE), 0);
}

export function remainingAbilityPoints(abilities: AbilityScores): number {
  return POINT_BUDGET - totalAbilityPointsSpent(abilities);
}
