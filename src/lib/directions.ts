import { Directions } from "@/types/Directions";
import type { Database } from "@/types/database.generated";

type DirectionEnum = Database["public"]["Enums"]["direction_enum"];

export const DIRECTION_OPTIONS: { value: Directions; label: string }[] = [
  { value: Directions.North, label: "North" },
  { value: Directions.West, label: "West" },
  { value: Directions.South, label: "South" },
  { value: Directions.East, label: "East" },
];

const DB_DIRECTION: Record<Directions, DirectionEnum> = {
  [Directions.North]: "North",
  [Directions.West]: "West",
  [Directions.South]: "South",
  [Directions.East]: "East",
};

export const directionToDbEnum = (direction: Directions): DirectionEnum => DB_DIRECTION[direction];

const OPPOSITE: Record<Directions, Directions> = {
  [Directions.North]: Directions.South,
  [Directions.West]: Directions.East,
  [Directions.South]: Directions.North,
  [Directions.East]: Directions.West,
};

export const oppositeDirection = (direction: Directions): Directions => OPPOSITE[direction];
