import type { Room, Section } from "@/types/Room";
import type { Directions } from "@/types/Directions";
import type { CharacterData } from "@/types/Character";
import type { Consumable, Item } from "@/types/Item";
import type { DialogueNode, Quest } from "@/types/RoomInteractions";
import type { Spell } from "@/types/Spell";
import { useGameStore } from "./GameState";

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
  roomInstances: [number, any][];
  gameStatus: number;
  combatOrder: any[];
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
  dialogueTrees: [number, any][];
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
  try {
    const raw = localStorage.getItem(SAVE_PREFIX + slotName);
    if (!raw) return null;
    const data: SaveData = JSON.parse(raw);
    return data.label || slotName;
  } catch {
    return null;
  }
}

export function deleteSave(slotName: string): void {
  localStorage.removeItem(SAVE_PREFIX + slotName);
}

export function normalizeNeighbors(room: Room): any {
  return {
    ...room,
    neighboringRooms: room.neighboringRooms.map(
      ([dir, neighborRoom]: [Directions, Room]) => [dir, neighborRoom.id],
    ),
  };
}

export function denormalizeNeighbors(
  room: any,
  roomLookup: Map<number, Room>,
): Room {
  return {
    ...room,
    neighboringRooms: room.neighboringRooms.map(
      ([dir, neighborId]: [Directions, number]) => {
        const found = roomLookup.get(neighborId);
        if (found) return [dir, found];
        const stub: Room = {
          id: neighborId,
          name: "Unknown",
          sectionId: 0,
          enemies: [],
          neighboringRooms: [],
          interaction: null,
        };
        roomLookup.set(neighborId, stub);
        return [dir, stub];
      },
    ),
  };
}

export function saveToSlot(slotName: string): void {
  const state = useGameStore.getState();

  const roomInstances: [number, any][] = [];
  state.roomInstances.forEach((room: Room, id: number) => {
    roomInstances.push([id, normalizeNeighbors(room)]);
  });

  const dialogueTrees: [number, any][] = [];
  state.dialogueTrees.forEach((node: DialogueNode, id: number) => {
    dialogueTrees.push([id, node]);
  });

  const data: SaveData = {
    version: 1,
    timestamp: Date.now(),
    label: slotName,
    party: state.party,
    activityLog: state.activityLog,
    inventory: state.inventory,
    goldPieces: state.goldPieces,
    accumulatedExp: state.accumulatedExp,
    quests: state.quests,
    conversationFlags: state.conversationFlags,
    currentSection: state.currentSection,
    beatenSections: state.beatenSections,
    availableSections: state.availableSections,
    currentRoomId: state.room.id,
    roomInstances,
    gameStatus: state.gameStatus,
    combatOrder: state.combatOrder,
    activeFighterIndex: state.activeFighterIndex,
    activeDialogue: state.activeDialogue,
    currentDialogueNodeId: state.currentDialogueNodeId,
    dialogueIndex: state.dialogueIndex,
    lastHitEnemyId: state.lastHitEnemyId,
    lastHitCounter: state.lastHitCounter,
    lastDefeatedEnemyId: state.lastDefeatedEnemyId,
    lastDefeatedCounter: state.lastDefeatedCounter,
    isTargeting: state.isTargeting,
    targetingSpell: state.targetingSpell,
    targetingConsumable: state.targetingConsumable,
    isLevelingUp: state.isLevelingUp,
    levelingUpChars: state.levelingUpChars,
    currentLevelingCharIndex: state.currentLevelingCharIndex,
    dialogueTrees,
  };

  localStorage.setItem(SAVE_PREFIX + slotName, JSON.stringify(data));
}

export function getSaveData(slotName: string): SaveData | null {
  try {
    const raw = localStorage.getItem(SAVE_PREFIX + slotName);
    if (!raw) return null;
    return JSON.parse(raw) as SaveData;
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
        const data = JSON.parse(e.target?.result as string) as SaveData;
        const slotName = data.label || `imported_${Date.now()}`;
        localStorage.setItem(SAVE_PREFIX + slotName, JSON.stringify(data));
        resolve(slotName);
      } catch {
        reject(new Error("Invalid save file"));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
}
