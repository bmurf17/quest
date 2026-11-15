import type { EnemyMove } from "./EnemyMove";
import type { Item } from "./Item";

export type EnemyRewardItem = {
  item: Item;
  quantity: number;
};

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
  /** Gold granted when this enemy is defeated. */
  goldReward?: number;
  /** Items granted when this enemy is defeated. */
  rewardItems?: EnemyRewardItem[];
};
