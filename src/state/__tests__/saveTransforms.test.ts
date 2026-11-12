import { describe, expect, it } from "vitest";
import type { Room } from "@/types/Room";
import { Directions } from "@/types/Directions";
import {
  denormalizeNeighbors,
  hydrateRoomInstances,
  normalizeNeighbors,
  type SerializedRoom,
} from "@/state/saveTransforms";
import { SaveDataError } from "@/state/saveSchema";

function room(id: number, name: string): Room {
  return {
    id,
    name,
    sectionId: 0,
    enemies: [],
    neighboringRooms: [],
    interaction: null,
  };
}

describe("save room transforms", () => {
  it("serializes neighbors as IDs and preserves the room shape", () => {
    const north = room(2, "North Room");
    const start = room(1, "Start Room");
    start.neighboringRooms = [[Directions.North, north]];

    const serialized = normalizeNeighbors(start);
    expect(serialized.neighboringRooms).toEqual([[Directions.North, 2]]);
    expect(serialized.id).toBe(1);
    expect(serialized.name).toBe("Start Room");
  });

  it("round-trips neighbors back to the canonical room objects", () => {
    const north = room(2, "North Room");
    const start = room(1, "Start Room");
    start.neighboringRooms = [[Directions.North, north]];
    const serialized = normalizeNeighbors(start);

    const lookup = new Map([
      [start.id, start],
      [north.id, north],
    ]);
    const restored = denormalizeNeighbors(serialized, lookup);

    expect(restored.neighboringRooms).toHaveLength(1);
    expect(restored.neighboringRooms[0][0]).toBe(Directions.North);
    expect(restored.neighboringRooms[0][1]).toBe(north);
  });

  it("throws instead of inventing an Unknown stub for missing rooms", () => {
    const serialized: SerializedRoom = {
      ...room(1, "Start Room"),
      neighboringRooms: [[Directions.North, 999]],
    };

    expect(() =>
      denormalizeNeighbors(serialized, new Map([[1, room(1, "Start Room")]])),
    ).toThrow(SaveDataError);
    expect(() =>
      denormalizeNeighbors(serialized, new Map([[1, room(1, "Start Room")]])),
    ).toThrow(/missing neighboring room 999/);
  });

  it("hydrates forward neighbor references in two passes", () => {
    const start = room(1, "Start Room");
    const north = room(2, "North Room");
    start.neighboringRooms = [[Directions.North, north]];
    north.neighboringRooms = [[Directions.South, start]];

    // Save order puts the room that references a later room first.
    const serialized: [number, SerializedRoom][] = [
      [1, normalizeNeighbors(start)],
      [2, normalizeNeighbors(north)],
    ];

    const instances = hydrateRoomInstances(serialized, new Map());

    const restoredStart = instances.get(1)!;
    const restoredNorth = instances.get(2)!;
    expect(restoredStart.neighboringRooms[0][1]).toBe(restoredNorth);
    expect(restoredNorth.neighboringRooms[0][1]).toBe(restoredStart);
  });

  it("raises a SaveDataError when a hydrated neighbor is missing", () => {
    const serialized: [number, SerializedRoom][] = [
      [
        1,
        {
          ...room(1, "Start Room"),
          neighboringRooms: [[Directions.North, 999]],
        },
      ],
    ];

    expect(() => hydrateRoomInstances(serialized, new Map())).toThrow(
      SaveDataError,
    );
  });
});
