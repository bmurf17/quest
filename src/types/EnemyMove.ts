import type { DamageDice } from "./Item";

export type EnemyMoveEffect =
  | { type: 'damage'; damageDice?: DamageDice; target: 'single' | 'all' | 'random' }
  | { type: 'heal'; healDice?: DamageDice; target: 'self' | 'all_allies' | 'lowest_hp_ally' }
  | { type: 'buff'; stat: 'strength' | 'defense' | 'dex'; amount: number; duration: number; target: 'self' | 'all_allies' }
  | { type: 'debuff'; stat: 'defense' | 'strength' | 'dex'; amount: number; duration: number; target: 'single' }
  | { type: 'spawn'; spawnIndex: number; count: number };

export type EnemyMove = {
  name: string;
  description: string;
  cooldown: number;
  weight: number;
  effect: EnemyMoveEffect;
  phase?: number;
};

export type ActiveBuff = {
  stat: string;
  amount: number;
  remainingTurns: number;
  source: string;
};
