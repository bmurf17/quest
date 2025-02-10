import { Enemy } from "./Enemy";

export type Room = {
  enemies: Enemy[];
};

export const room: Room = {
  enemies: [{ name: "mushroom", health: 10 }],
};
