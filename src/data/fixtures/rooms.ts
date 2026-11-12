import { Directions } from "@/types/Directions";
import type { Room } from "@/types/Room";
import { NPCType, type RoomInteraction } from "@/types/RoomInteractions";

const merchantInteraction: RoomInteraction = {
  type: "NPC",
  npc: {
    name: "Merchant",
    dialogue: ["What can I do for you?"],
    discoveryMessage: "Well met travelers!",
    NPCType: NPCType.MERCHANT,
    img: "",
  },
};

/**
 * Builds the demo rooms with their circular neighbour links.
 *
 * The links are created inside the factory so importing this module has no
 * side effects on shared state.
 */
function createDemoRooms(): { startRoom: Room; northRoom: Room } {
  const northRoom: Room = {
    name: "north room",
    sectionId: 0,
    enemies: [],
    neighboringRooms: [],
    interaction: merchantInteraction,
    id: -1,
  };

  const startRoom: Room = {
    name: "Start Room",
    sectionId: 0,
    enemies: [],
    neighboringRooms: [],
    interaction: null,
    id: 1,
  };

  startRoom.neighboringRooms.push([Directions.North, northRoom]);
  northRoom.neighboringRooms.push([Directions.South, startRoom]);

  return { startRoom, northRoom };
}

export const { startRoom, northRoom } = createDemoRooms();
