import { Directions } from "./Directions";
import { Enemy } from "./Enemy";
import { RoomInteraction } from "./RoomInteractions";

export type Room = {
  name: string;
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
};

const eastRoom: Room = {
  name: "east room",
  enemies: [],
  neighboringRooms: [],
  interaction: {
    type: "chest",
    chest: {
      itemId: "",
      quantity: 0,
      isLocked: false
    }
  },
};

export const startRoom: Room = {
  name: "Start Room",
  enemies: [createMushroom()],
  neighboringRooms: [],
  interaction: null,
};

startRoom.neighboringRooms.push([Directions.North, northRoom]);
northRoom.neighboringRooms.push([Directions.South, startRoom]);
northRoom.neighboringRooms.push([Directions.East, eastRoom]);
eastRoom.neighboringRooms.push([Directions.West, northRoom])

export const rooms = [startRoom, northRoom, eastRoom];
