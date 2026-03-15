import { Item } from "./Item";

export enum NPCType {
  MERCHANT = "merchant",
  QUEST_GIVER = "quest_giver",
  GENERIC = "generic",
  ANIMAL = "animal"
}

export interface NPC {
  name: string;
  dialogue: string[];
  questId?: string;
  discoveryMessage?: string;
  NPCType: NPCType;
  img: string;
}

export type Chest = {
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

export type RoomInteraction =
  | { type: "NPC"; npc: NPC }
  | { type: "chest"; chest: Chest }
  | { type: "camp"; camp: Camp }
  | { type: "transition"; transition: Transition };

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
    default:
      return `There's something interesting in this room.`;
  }
}