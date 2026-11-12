import type { RoomInteraction } from "@/types/RoomInteractions";

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
          ? "There's a locked chest here."
          : "You spot an unlocked chest containing something valuable.")
      );
    case "camp":
      return (
        interaction.camp.discoveryMessage ||
        "You find a peaceful camping spot where you can rest."
      );
    case "transition":
      return (
        interaction.transition.discoveryMessage ||
        (interaction.transition.destination === "next_dungeon"
          ? "A passage leading deeper into the dungeon looms before you."
          : "A warm light beckons — a sanctuary lies ahead.")
      );
    case "cutscene":
      return (
        interaction.cutscene.discoveryMessage ||
        "A vision begins to unfold before your eyes..."
      );
    default:
      return "There's something interesting in this room.";
  }
}
