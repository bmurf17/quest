import type { Enemy } from "@/types/Enemy";
import type { EnemyMove } from "@/types/EnemyMove";
import { getDefaultEnemyMove, getEnemyMaxHealth } from "@/state/utils/CombatUtils";

const averageDice = (dice: { numDice: number; dieSize: number; bonus: number } | undefined) =>
  dice ? dice.numDice * ((dice.dieSize + 1) / 2) + dice.bonus : 0;

/** Expected damage contribution of a single move, ignoring cooldown gating. */
export function expectedMoveDamage(move: EnemyMove, enemy: Enemy): number {
  if (move.effect.type === "damage") {
    return averageDice(move.effect.damageDice) || enemy.strength + 3.5;
  }
  if (move.effect.type === "heal") {
    return -(averageDice(move.effect.healDice) || enemy.strength + 3.5);
  }
  return 0;
}

export interface EnemyEstimate {
  maxHealth: number;
  effectiveHealth: number;
  averageDamage: number;
  threat: number;
  label: "trivial" | "standard" | "tough" | "deadly";
}

/**
 * Deterministic balance heuristic. Not a replacement for playing the fight:
 * it compares effective health (health + defense mitigation) against the
 * enemy's average move output so wildly out-of-band stats stand out.
 */
export function estimateEnemy(enemy: Enemy): EnemyEstimate {
  const maxHealth = getEnemyMaxHealth(enemy);
  const involved = 3;
  const mitigation = 1 + Math.max(0, enemy.defense) / 25;
  const effectiveHealth = Math.round(maxHealth * mitigation * (1 + Math.max(0, enemy.dex) / 100));

  const moves =
    Array.isArray(enemy.moves) && enemy.moves.length > 0 ? enemy.moves : [getDefaultEnemyMove()];
  const averageDamage =
    moves.reduce((total, move) => total + expectedMoveDamage(move, enemy), 0) / moves.length;

  const offense = Math.max(0, averageDamage) * involved;
  const threat = Math.round(effectiveHealth * 0.6 + offense * 4);

  const label: EnemyEstimate["label"] =
    threat < 60 ? "trivial" : threat < 150 ? "standard" : threat < 300 ? "tough" : "deadly";

  return {
    maxHealth,
    effectiveHealth,
    averageDamage: Math.round(averageDamage * 10) / 10,
    threat,
    label,
  };
}
