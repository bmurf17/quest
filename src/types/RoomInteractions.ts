import { Item } from "./Item";

export interface NPC {
  name: string;
  dialogue: string[];
  questId?: string;
  discoveryMessage?: string;
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

export type RoomInteraction =
  | { type: "NPC"; npc: NPC }
  | { type: "chest"; chest: Chest }
  | { type: "camp"; camp: Camp };

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
    default:
      return `There's something interesting in this room.`;
  }
}
