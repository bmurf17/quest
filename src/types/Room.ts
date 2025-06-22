import { Directions } from "./Directions";
import { Enemy } from "./Enemy";
import { RoomInteraction } from "./RoomInteractions";

export type Room = {
  enemies: Enemy[];
  neighboringRooms: [Directions, Room][];
  interaction: RoomInteraction | null;
};

const createMushroom = (): Enemy => ({
  name: "mushroom",
  health: 10,
  id: 0,
});

const northRoom: Room = {
  enemies: [],
  neighboringRooms: [],
  interaction: {
    type: "npc",
    npc: {
      name: "Merchant",
      dialogue: ["What can I do for you?"],
      discoveryMessage: "Well met travelers!",
    },
  },
};

export const startRoom: Room = {
  enemies: [createMushroom()],
  neighboringRooms: [],
  interaction: null,
};

startRoom.neighboringRooms.push([Directions.North, northRoom]);
northRoom.neighboringRooms.push([Directions.South, startRoom]);
