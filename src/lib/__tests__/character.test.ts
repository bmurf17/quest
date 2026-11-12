import { describe, expect, it } from "vitest";
import { POINT_BUDGET } from "@/consts/constants";
import {
  ABILITY_BASE,
  abilityModifier,
  remainingAbilityPoints,
  totalAbilityPointsSpent,
  type AbilityScores,
} from "@/lib/character";

const scores = (value: number): AbilityScores => ({
  strength: value,
  dexterity: value,
  constitution: value,
  intelligence: value,
  wisdom: value,
  charisma: value,
  defense: value,
});

describe("abilityModifier", () => {
  it("follows the D&D modifier curve", () => {
    expect(abilityModifier(8)).toBe(-1);
    expect(abilityModifier(10)).toBe(0);
    expect(abilityModifier(11)).toBe(0);
    expect(abilityModifier(14)).toBe(2);
    expect(abilityModifier(20)).toBe(5);
  });
});

describe("point buy helpers", () => {
  it("totals points above the base score", () => {
    expect(totalAbilityPointsSpent(scores(ABILITY_BASE))).toBe(0);
    expect(totalAbilityPointsSpent(scores(ABILITY_BASE + 2))).toBe(14);
  });

  it("reports remaining points from the shared budget", () => {
    expect(remainingAbilityPoints(scores(ABILITY_BASE))).toBe(POINT_BUDGET);
  });
});
