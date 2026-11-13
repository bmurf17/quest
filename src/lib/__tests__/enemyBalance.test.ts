import { describe, expect, it } from "vitest";
import { estimateEnemy, expectedMoveDamage } from "@/lib/enemyBalance";
import type { Enemy } from "@/types/Enemy";

const enemy = (overrides: Partial<Enemy> = {}): Enemy => ({
  id: 1,
  name: "Test Enemy",
  health: 20,
  strength: 5,
  dex: 5,
  defense: 5,
  img: "",
  expGain: 10,
  ...overrides,
});

describe("expectedMoveDamage", () => {
  it("averages damage dice and adds the bonus", () => {
    const move = {
      name: "Bite",
      description: "",
      cooldown: 0,
      weight: 1,
      effect: {
        type: "damage" as const,
        target: "single" as const,
        damageDice: { numDice: 2, dieSize: 6, bonus: 2 },
      },
    };

    // 2 * 3.5 + 2
    expect(expectedMoveDamage(move, enemy())).toBe(9);
  });

  it("falls back to strength plus a d6 for plain attacks", () => {
    const move = {
      name: "Claw",
      description: "",
      cooldown: 0,
      weight: 1,
      effect: { type: "damage" as const, target: "single" as const },
    };

    expect(expectedMoveDamage(move, enemy({ strength: 4 }))).toBe(7.5);
  });

  it("treats healing as negative damage", () => {
    const move = {
      name: "Mend",
      description: "",
      cooldown: 0,
      weight: 1,
      effect: {
        type: "heal" as const,
        target: "self" as const,
        healDice: { numDice: 1, dieSize: 8, bonus: 0 },
      },
    };

    expect(expectedMoveDamage(move, enemy())).toBe(-4.5);
  });
});

describe("estimateEnemy", () => {
  it("uses max health when present and scales defense into effective health", () => {
    const base = estimateEnemy(enemy({ health: 10, maxHealth: 40, defense: 0 }));
    const armored = estimateEnemy(enemy({ health: 10, maxHealth: 40, defense: 25 }));

    expect(base.maxHealth).toBe(40);
    expect(armored.effectiveHealth).toBeGreaterThan(base.effectiveHealth);
  });

  it("raises threat as offensive stats rise", () => {
    const weak = estimateEnemy(enemy({ strength: 1, moves: [] }));
    const strong = estimateEnemy(enemy({ strength: 20, moves: [] }));

    expect(strong.threat).toBeGreaterThan(weak.threat);
  });

  it("labels encounters on a stable scale", () => {
    expect(estimateEnemy(enemy({ health: 5, strength: 1, defense: 0 })).label).toBe("trivial");
    expect(estimateEnemy(enemy({ health: 300, strength: 30, defense: 20 })).label).toBe("deadly");
  });
});
