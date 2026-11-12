import type { Room, Section } from "@/types/Room";
import type { CharacterData } from "@/types/Character";
import type { Consumable, Item } from "@/types/Item";
import type { Enemy } from "@/types/Enemy";
import type { DialogueNode, Quest } from "@/types/RoomInteractions";
import type { Spell } from "@/types/Spell";
import type { ActiveBuff } from "@/types/EnemyMove";
import type { GameStatus } from "@/types/GameStatus";
import { useGameStore } from "./GameState";
import type { GameState } from "./GameState";
import { normalizeNeighbors, type SerializedRoom } from "./saveTransforms";
import {
  parseSaveData,
  SaveDataError,
  SAVE_VERSION,
} from "./saveSchema";

export type { SerializedRoom };
export { normalizeNeighbors } from "./saveTransforms";
export { denormalizeNeighbors } from "./saveTransforms";
export { SaveDataError, SAVE_VERSION } from "./saveSchema";

export interface SaveData {
  version: number;
  timestamp: number;
  label: string;
  party: CharacterData[];
  activityLog: string[];
  inventory: Item[];
  goldPieces: number;
  accumulatedExp: number;
  quests: Quest[];
  conversationFlags: Record<string, Record<string, string>>;
  currentSection: number | null;
  beatenSections: number[];
  availableSections: Section[];
  currentRoomId: number;
  roomInstances: [number, SerializedRoom][];
  gameStatus: GameStatus;
  combatOrder: (CharacterData | Enemy)[];
  activeFighterIndex: number;
  activeDialogue: DialogueNode | null;
  currentDialogueNodeId: string | null;
  dialogueIndex: number;
  lastHitEnemyId: string | null;
  lastHitCounter: number;
  lastDefeatedEnemyId: string | null;
  lastDefeatedCounter: number;
  isTargeting: boolean;
  targetingSpell: Spell | null;
  targetingConsumable: Consumable | null;
  isLevelingUp: boolean;
  levelingUpChars: CharacterData[];
  currentLevelingCharIndex: number;
  dialogueTrees: [number, DialogueNode][];
  activeCutsceneId: string | null;
  cutsceneSceneIndex: number;
  enemyCooldowns: [number, [string, number][]][];
  activeBuffs: [string, ActiveBuff[]][];
}

/**
 * Save fields that are copied verbatim between the store and a save file.
 * Keeping the list in one place prevents `saveToSlot` and `loadGame` from
 * drifting apart when state fields are added.
 */
export const DIRECT_SAVE_FIELDS = [
  "party",
  "activityLog",
  "inventory",
  "goldPieces",
  "accumulatedExp",
  "quests",
  "conversationFlags",
  "currentSection",
  "beatenSections",
  "availableSections",
  "gameStatus",
  "combatOrder",
  "activeFighterIndex",
  "activeDialogue",
  "currentDialogueNodeId",
  "dialogueIndex",
  "lastHitEnemyId",
  "lastHitCounter",
  "lastDefeatedEnemyId",
  "lastDefeatedCounter",
  "isTargeting",
  "targetingSpell",
  "targetingConsumable",
  "isLevelingUp",
  "levelingUpChars",
  "currentLevelingCharIndex",
  "cutsceneSceneIndex",
] as const;

export type DirectSaveField = (typeof DIRECT_SAVE_FIELDS)[number];

/** Fields that need normalization or are metadata rather than raw state. */
export const SPECIAL_SAVE_FIELDS = [
  "version",
  "timestamp",
  "label",
  "currentRoomId",
  "roomInstances",
  "dialogueTrees",
  "activeCutsceneId",
  "enemyCooldowns",
  "activeBuffs",
] as const;

type SpecialSaveField = (typeof SPECIAL_SAVE_FIELDS)[number];

// Compile-time completeness check: adding a field to SaveData without listing
// it here (or handling it specially) is a type error.
type MissingSaveFields = Exclude<
  keyof SaveData,
  DirectSaveField | SpecialSaveField
>;
const _saveShapeIsComplete: MissingSaveFields extends never ? true : never = true;
void _saveShapeIsComplete;

/**
 * Copy the directly-serialized fields from either a `SaveData` object or the
 * game store. Used by both save and load so the two stay in sync.
 */
export function pickDirectSaveFields<
  T extends Pick<SaveData, DirectSaveField>,
>(source: T): Pick<SaveData, DirectSaveField> {
  const result = {} as Pick<SaveData, DirectSaveField>;
  const writable = result as Record<DirectSaveField, unknown>;
  for (const field of DIRECT_SAVE_FIELDS) {
    writable[field] = source[field];
  }
  return result;
}

export function buildSaveData(state: GameState, slotName: string): SaveData {
  const roomInstances: [number, SerializedRoom][] = [];
  state.roomInstances.forEach((room: Room, id: number) => {
    roomInstances.push([id, normalizeNeighbors(room)]);
  });

  const dialogueTrees: [number, DialogueNode][] = [];
  state.dialogueTrees.forEach((node: DialogueNode, id: number) => {
    dialogueTrees.push([id, node]);
  });

  const enemyCooldowns: [number, [string, number][]][] = [];
  state.enemyCooldowns.forEach((moveCds, enemyId) => {
    enemyCooldowns.push([enemyId, [...moveCds.entries()]]);
  });

  const activeBuffs: [string, ActiveBuff[]][] = [];
  state.activeBuffs.forEach((buffs, name) => {
    activeBuffs.push([name, buffs]);
  });

  return {
    version: SAVE_VERSION,
    timestamp: Date.now(),
    label: slotName,
    currentRoomId: state.room.id,
    roomInstances,
    dialogueTrees,
    activeCutsceneId: state.activeCutscene?.id ?? null,
    enemyCooldowns,
    activeBuffs,
    ...pickDirectSaveFields(state),
  };
}

const SAVE_PREFIX = "quest_save_";

export function getSaveKeys(): string[] {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(SAVE_PREFIX)) {
      keys.push(key.slice(SAVE_PREFIX.length));
    }
  }
  return keys;
}

export function getSaveLabel(slotName: string): string | null {
  const data = peekSaveData(slotName);
  return data ? data.label || slotName : null;
}

export function deleteSave(slotName: string): void {
  localStorage.removeItem(SAVE_PREFIX + slotName);
}

export function saveToSlot(slotName: string): void {
  const data = buildSaveData(useGameStore.getState(), slotName);
  localStorage.setItem(SAVE_PREFIX + slotName, JSON.stringify(data));
}

/**
 * Read and validate a save. Returns `null` when the slot does not exist, and
 * throws {@link SaveDataError} when the stored data is corrupt or unsupported.
 */
export function getSaveData(slotName: string): SaveData | null {
  const raw = localStorage.getItem(SAVE_PREFIX + slotName);
  if (!raw) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new SaveDataError(`Save "${slotName}" is not valid JSON`);
  }
  return parseSaveData(parsed);
}

/**
 * Like {@link getSaveData}, but swallows errors. Use this for save-slot
 * listings where a corrupt slot should not break the whole UI.
 */
export function peekSaveData(slotName: string): SaveData | null {
  try {
    return getSaveData(slotName);
  } catch {
    return null;
  }
}

export function exportSaveAsJson(slotName: string): void {
  const data = getSaveData(slotName);
  if (!data) return;
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${slotName}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importSaveFromJson(file: File): Promise<string | null> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        let parsed: unknown;
        try {
          parsed = JSON.parse(String(e.target?.result));
        } catch {
          throw new SaveDataError("Save file is not valid JSON");
        }
        // Validate and migrate before touching localStorage.
        const data = parseSaveData(parsed);
        const slotName = data.label || `imported_${Date.now()}`;
        localStorage.setItem(
          SAVE_PREFIX + slotName,
          JSON.stringify({ ...data, label: slotName }),
        );
        resolve(slotName);
      } catch (error) {
        reject(
          error instanceof SaveDataError
            ? error
            : new Error("Invalid save file"),
        );
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
}
