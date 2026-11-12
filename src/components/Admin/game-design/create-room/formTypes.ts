import { EnemyMoveEffect } from "@/types/EnemyMove";

export interface MoveEntry {
  name: string;
  description: string;
  cooldown: number;
  weight: number;
  effect: EnemyMoveEffect;
  phase?: number;
}

export interface EnemyEntry {
  name: string;
  health: number;
  strength: number;
  dex: number;
  defense: number;
  img: string;
  expGain: number;
  type: "enemy" | "boss";
  maxHealth?: number;
  phaseThresholds: number[];
  moves: MoveEntry[];
  spawns: EnemyEntry[];
}

export const defaultEnemy = (enemyImgs: string[]): EnemyEntry => ({
  name: "",
  health: 100,
  strength: 10,
  dex: 10,
  defense: 10,
  img: enemyImgs[0] ?? "",
  expGain: 10,
  type: "enemy",
  maxHealth: undefined,
  phaseThresholds: [],
  moves: [],
  spawns: [],
});

export const defaultMove = (): MoveEntry => ({
  name: "",
  description: "",
  cooldown: 0,
  weight: 1,
  effect: { type: "damage", target: "single" },
});
