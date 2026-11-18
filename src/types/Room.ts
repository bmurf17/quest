import type { Directions } from "./Directions";
import type { Enemy } from "./Enemy";
import type { RoomInteraction } from "./RoomInteractions";

export type Section = {
  id: number;
  name: string;
  /** Room exploration begins in. Falls back to the lowest-id room. */
  startRoomId?: number | null;
};

export type Room = {
  id: number;
  name: string;
  sectionId: number;
  enemies: Enemy[];
  neighboringRooms: [Directions, Room][];
  interaction: RoomInteraction | null;
  /** Saved Realm Map drag position. Null/missing means auto-layout. */
  mapX?: number | null;
  mapY?: number | null;
};
