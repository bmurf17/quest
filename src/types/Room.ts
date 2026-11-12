import type { Directions } from "./Directions";
import type { Enemy } from "./Enemy";
import type { RoomInteraction } from "./RoomInteractions";

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
