import { describe, it, expect, vi } from "vitest";
import { calcDamage, safeNextIndex, isEnemy } from "@/state/utils/CombatUtils";
import type { CharacterData } from "@/types/Character";
import type { Enemy } from "@/types/Enemy";

describe("GameState helpers", () => {
  it("safeNextIndex returns 0 when length is 0", () => {
    expect(safeNextIndex(3, 0)).toBe(0);
  });

  it("safeNextIndex computes wrapped index", () => {
    expect(safeNextIndex(1, 4)).toBe(2);
    expect(safeNextIndex(3, 4)).toBe(0);
  });

  it("calcDamage respects miss when hitChance < defense", () => {
    // Force Math.random to return 0 so hitChance is low
    vi.spyOn(Math, "random").mockReturnValue(0);
    // dex = 1, roll = 1, so hitChance = 2
    const dmg = calcDamage(10, 5, 1);
    expect(dmg).toBe(0);
    vi.restoreAllMocks();
  });

  it("isEnemy identifies an enemy-like object", () => {
    const maybeEnemy = { id: 1, health: 10, name: "Bad Guy" } as Enemy;
    expect(isEnemy(maybeEnemy)).toBe(true);
    expect(isEnemy(undefined)).toBe(false);
    expect(isEnemy({ name: "Not enemy" } as CharacterData)).toBe(false);
  });
});
