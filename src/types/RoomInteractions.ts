import { Item } from "./Item";
import { Room } from "./Room";
import { Enemy } from "./Enemy";

export enum NPCType {
  MERCHANT = "merchant",
  QUEST_GIVER = "quest_giver",
  GENERIC = "generic",
  ANIMAL = "animal"
}

export enum NPCDisposition {
  NEUTRAL = "neutral",
  FRIENDLY = "friendly",
  HOSTILE = "hostile"
}

export enum DialogueOutcomeType {
  NONE = "none",
  QUEST_START = "quest_start",
  ITEM_GIVE = "item_give",
  NPC_JOIN = "npc_join",
  NPC_HOSTILE = "npc_hostile",
  NPC_FRIENDLY = "npc_friendly",
  NPC_LEAVE = "npc_leave",
  END_CONVERSATION = "end_conversation"
}

export interface SkillCondition {
  skill: string;
  dc: number;
  successNodeId?: string;
  failureNodeId?: string;
}

export interface DialogueOutcome {
  type: DialogueOutcomeType;
  value?: string;
  flagKey?: string;
  flagValue?: string;
}

export interface DialogueChoice {
  id: string;
  text: string;
  nextNodeId: string | null;
  skillCondition?: SkillCondition;
  outcome?: DialogueOutcome;
}

export interface DialogueNode {
  id: string;
  text: string;
  speaker: "NPC";
  choices?: DialogueChoice[];
  outcome?: DialogueOutcome;
  isEndpoint: boolean;
}

export type QuestType =
  | { type: "fetch"; item: Item }
  | { type: "defeat"; enemy: Enemy }
  | { type: "explore"; requireRoom: Room }

export interface Quest {
  id: number;
  name: string;
  description: string;
  type: QuestType;
  objectives: string[];
  rewards: Item[];
  accepted: boolean;
  completed: boolean;
}

export interface NPC {
  id?: number;
  name: string;
  dialogue: string[];
  dialogueId?: string;
  quest?: Quest;
  discoveryMessage?: string;
  NPCType: NPCType;
  img: string;
  disposition?: NPCDisposition;
}

export interface Chest {
  id: number;
  itemId: string;
  quantity: number;
  isLocked: boolean;
  isOpen: boolean;
  discoveryMessage: string | null;
  item: Item | null; 
};

export interface Camp {
  healAmount: number;
  restoresMana: boolean;
  cost?: number;
  discoveryMessage?: string;
}

export type TransitionDestination = "next_dungeon" | "sanctuary";

export interface Transition {
  destination: TransitionDestination;
  sanctuaryAvailable: boolean; 
  discoveryMessage?: string;
}

export interface CutsceneRef {
  cutsceneId: string;
  discoveryMessage?: string;
}

export type RoomInteraction =
  | { type: "NPC"; npc: NPC }
  | { type: "chest"; chest: Chest }
  | { type: "camp"; camp: Camp }
  | { type: "transition"; transition: Transition }
  | { type: "cutscene"; cutscene: CutsceneRef };

export function getDiscoveryMessage(interaction: RoomInteraction): string {
  switch (interaction.type) {
    case "NPC":
      return (
        interaction.npc.discoveryMessage ||
        `You notice ${interaction.npc.name} in this room.`
      );
    case "chest":
      return (
        interaction.chest.discoveryMessage ||
        (interaction.chest.isLocked
          ? `There's a locked chest here.`
          : `You spot an unlocked chest containing something valuable.`)
      );
    case "camp":
      return (
        interaction.camp.discoveryMessage ||
        `You find a peaceful camping spot where you can rest.`
      );
    case "transition":
      return (
        interaction.transition.discoveryMessage ||
        (interaction.transition.destination === "next_dungeon"
          ? `A passage leading deeper into the dungeon looms before you.`
          : `A warm light beckons — a sanctuary lies ahead.`)
      );
    case "cutscene":
      return (
        interaction.cutscene.discoveryMessage ||
        `A vision begins to unfold before your eyes...`
      );
    default:
      return `There's something interesting in this room.`;
  }
}