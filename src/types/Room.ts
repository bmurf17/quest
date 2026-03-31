import { Directions } from "./Directions";
import { Enemy } from "./Enemy";
import { NPCType, RoomInteraction } from "./RoomInteractions";

export type Section = {
  id: number;
  name: string;
};

export type Room = {
  id: number;
  name: string;
  sectionId: number;
  enemies: Enemy[];
  neighboringRooms: [Directions, Room][];
  interaction: RoomInteraction | null;
};

const northRoom: Room = {
  name: "north room",
  sectionId: 0,
  enemies: [],
  neighboringRooms: [],
  interaction: {
    type: "NPC",
    npc: {
      name: "Merchant",
      dialogue: ["What can I do for you?"],
      discoveryMessage: "Well met travelers!",
      NPCType: NPCType.MERCHANT,
      img: ""
    },
  },
  id: -1
};

export const startRoom: Room = {
  name: "Start Room",
  sectionId: 0,
  enemies: [],
  neighboringRooms: [],
  interaction: null,
  id: 1
};

startRoom.neighboringRooms.push([Directions.North, northRoom]);
northRoom.neighboringRooms.push([Directions.South, startRoom]);

