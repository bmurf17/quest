import type { EnemyMoveEffect } from "@/types/EnemyMove";
import type { QuickDialogueChoiceInput } from "@/lib/quickDialogue";

export type NpcSource = "new" | "existing";

export interface QuickDialogueChoiceEntry extends QuickDialogueChoiceInput {
  key: number;
}

export interface QuickDialogueLineEntry {
  key: number;
  text: string;
  choices: QuickDialogueChoiceEntry[];
}

export interface ExistingNpcOption {
  id: number;
  name: string;
  npcType: string;
  treeName: string | null;
  hasTree: boolean;
}

export const defaultQuickDialogueLine = (key: number): QuickDialogueLineEntry => ({
  key,
  text: "",
  choices: [],
});

export const defaultQuickDialogueChoice = (key: number): QuickDialogueChoiceEntry => ({
  key,
  text: "",
  outcomeType: "none",
  outcomeValue: "",
});

export interface MoveEntry {
  name: string;
  description: string;
  cooldown: number;
  weight: number;
  effect: EnemyMoveEffect;
  phase?: number;
}

export interface EnemyEntry {
  /** When set, the room links this existing library enemy instead of creating a copy. */
  libraryId?: number;
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
