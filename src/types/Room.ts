import { Directions } from "./Directions";
import { Enemy } from "./Enemy";
import { RoomInteraction } from "./RoomInteractions";

export type Room = {
  id: number;
  name: string;
  enemies: Enemy[];
  neighboringRooms: [Directions, Room][];
  interaction: RoomInteraction | null;
};

const northRoom: Room = {
  name: "north room",
  enemies: [],
  neighboringRooms: [],
  interaction: {
    type: "NPC",
    npc: {
      name: "Merchant",
      dialogue: ["What can I do for you?"],
      discoveryMessage: "Well met travelers!",
    },
  },
  id: 0
};



export const startRoom: Room = {
  name: "Start Room",
  enemies: [],
  neighboringRooms: [],
  interaction: null,
  id: 0
};

startRoom.neighboringRooms.push([Directions.North, northRoom]);
northRoom.neighboringRooms.push([Directions.South, startRoom]);

