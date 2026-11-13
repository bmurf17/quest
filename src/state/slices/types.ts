import type { StateCreator } from "zustand";
import type { CharacterData, CharacterEquipment } from "@/types/Character";
import type { Directions } from "@/types/Directions";
import type { Enemy } from "@/types/Enemy";
import type { ActiveBuff } from "@/types/EnemyMove";
import type { GameStatus } from "@/types/GameStatus";
import type { Consumable, Item } from "@/types/Item";
import type { Room, Section } from "@/types/Room";
import type { Cutscene } from "@/types/Cutscene";
import type {
  Camp,
  Chest,
  DialogueNode,
  DialogueOutcome,
  NPC,
  NPCDisposition,
  Quest,
} from "@/types/RoomInteractions";
import type { Spell } from "@/types/Spell";
import type { TavernConfig } from "@/types/Tavern";
import type { SaveData } from "@/state/saveLoad";

/**
 * The complete game store. Each slice in this folder owns a subset of these
 * fields; the interface itself stays in one place so actions can freely read
 * and write state owned by another slice.
 */
export interface GameState {
  // Activity log -----------------------------------------------------------
  activityLog: string[];
  addToLog: (log: string) => void;

  // Party, leveling, and tavern -------------------------------------------
  party: CharacterData[];
  setParty: (characters: CharacterData[]) => void;
  accumulatedExp: number;
  isLevelingUp: boolean;
  levelingUpChars: CharacterData[];
  currentLevelingCharIndex: number;
  setLevelingUpChars: (chars: CharacterData[]) => void;
  applyLevelUp: (char: CharacterData) => void;
  nextLevelingChar: () => void;
  quests: Quest[];
  acceptQuest: (quest: Quest) => void;
  tavernCandidates: CharacterData[];
  isTavernOpen: boolean;
  tavernConfig: TavernConfig;
  hasRecruitedFromTavern: boolean;
  openTavern: () => void;
  closeTavern: () => void;
  addTavernCharacterToParty: (char: CharacterData) => void;
  setTavernConfig: (config: TavernConfig) => void;
  enterTown: () => void;
  exitTown: () => void;
  restInTown: () => void;
  retryFromGameOver: () => void;

  // Combat ----------------------------------------------------------------
  combatOrder: (CharacterData | Enemy)[];
  activeFighterIndex: number;
  enemyCooldowns: Map<number, Map<string, number>>;
  activeBuffs: Map<string, ActiveBuff[]>;
  attack: (enemy: Enemy) => void;
  enterCombat: () => void;
  normalizeCombatOrder: () => void;
  isCurrentFighterEnemy: () => boolean;
  performEnemyTurn: () => void;
  castSpell: (spell: Spell, target?: Enemy | CharacterData) => void;
  lastHitEnemyId: string | null;
  lastHitCounter: number;
  lastDefeatedEnemyId: string | null;
  lastDefeatedCounter: number;
  isTargeting: boolean;
  setTargeting: (targeting: boolean) => void;
  targetingSpell: Spell | null;
  setTargetingSpell: (spell: Spell | null) => void;

  // Inventory and equipment ----------------------------------------------
  inventory: Item[];
  goldPieces: number;
  consumeItem: (item: Consumable, target?: CharacterData) => void;
  buyItem: (item: Item) => void;
  equipItem: (characterName: string, itemName: string) => void;
  unequipItem: (characterName: string, slot: keyof CharacterEquipment) => void;
  targetingConsumable: Consumable | null;
  setTargetingConsumable: (item: Consumable | null) => void;

  // Dialogue --------------------------------------------------------------
  speak: (npc: NPC) => void;
  dialogueIndex: number;
  advanceDialogue: () => void;
  activeDialogue: DialogueNode | null;
  currentDialogueNodeId: string | null;
  conversationFlags: Record<string, Record<string, string>>;
  dialogueTrees: Map<number, DialogueNode>;
  startDialogue: (npc: NPC, node?: DialogueNode) => void;
  preloadDialogueTrees: (rooms: Room[]) => void;
  selectDialogueChoice: (choiceId: string) => void;
  checkSkillCondition: (skill: string, dc: number) => boolean;
  applyOutcome: (outcome: DialogueOutcome, npc: NPC) => void;
  setDisposition: (npc: NPC, disposition: NPCDisposition) => void;

  // World: rooms, movement, chests, sections, cutscenes -------------------
  room: Room;
  roomInstances: Map<number, Room>;
  rooms: Room[];
  gameStatus: GameStatus;
  move: (direction: Directions) => void;
  rest: (camp: Camp) => void;
  setRooms: (rooms: Room[]) => void;
  addRoom: (room: Room) => void;
  updateRoom: (room: Room) => void;
  updateChest: (chest: Chest) => void;
  takeFromChest: (chest: Chest) => void;
  currentSection: number | null;
  beatenSections: number[];
  availableSections: Section[];
  loadSections: (sections: Section[]) => void;
  startSection: (sectionId: number, rooms: Room[]) => void;
  completeSection: () => void;
  isSectionUnlocked: (sectionId: number) => boolean;
  cutscenes: Map<string, Cutscene>;
  activeCutscene: Cutscene | null;
  cutsceneSceneIndex: number;
  loadCutscenes: (cutscenes: Cutscene[]) => void;
  playCutscene: (id: string) => void;
  advanceCutsceneScene: () => void;
  endCutscene: () => void;

  // Save/load -------------------------------------------------------------
  loadGame: (data: SaveData) => void;
}

/** A zustand slice whose state and actions are part of {@link GameState}. */
export type GameSlice<T> = StateCreator<GameState, [], [], T>;
