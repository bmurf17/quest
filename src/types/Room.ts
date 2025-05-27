import { Directions } from "./Directions";
import { Enemy } from "./Enemy";

export type Room = {
  enemies: Enemy[];
  neighboringRooms: [Directions, Room][];
};

const mushroom: Enemy = {
  name: "mushroom",
  health: 10,
  id: 0,
};

const northRoom: Room = {
  enemies: [],
  neighboringRooms: [],
};

export const startRoom: Room = {
  enemies: [mushroom],
  neighboringRooms: [],
};

startRoom.neighboringRooms.push([Directions.North, northRoom]);
northRoom.neighboringRooms.push([Directions.South, startRoom]);
