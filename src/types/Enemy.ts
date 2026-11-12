import type { EnemyMove } from "./EnemyMove";

export type Enemy = {
  id: number;
  name: string;
  health: number;
  maxHealth?: number;
  strength: number;
  dex: number;
  defense: number;
  img: string;
  expGain: number;
  type?: "enemy" | "boss";
  moves?: EnemyMove[];
  phase?: number;
  phaseThresholds?: number[];
  spawnOnDefeat?: number[];
  spawns?: Enemy[];
};
