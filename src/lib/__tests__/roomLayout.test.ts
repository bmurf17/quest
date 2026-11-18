import { describe, expect, it } from "vitest";
import { Directions } from "@/types/Directions";
import {
  buildRoomGraph,
  computeRealmLayout,
  computeSectionLayout,
  resolveStartRoom,
} from "@/lib/roomLayout";
import type { Room, Section } from "@/types/Room";

function makeRoom(id: number, name: string, sectionId = 1, overrides: Partial<Room> = {}): Room {
  return {
    id,
    name,
    sectionId,
    enemies: [],
    neighboringRooms: [],
    interaction: null,
    mapX: null,
    mapY: null,
    ...overrides,
  };
}

function link(a: Room, direction: Directions, b: Room) {
  const opposite =
    direction === Directions.North
      ? Directions.South
      : direction === Directions.South
        ? Directions.North
        : direction === Directions.East
          ? Directions.West
          : Directions.East;
  a.neighboringRooms.push([direction, b]);
  b.neighboringRooms.push([opposite, a]);
}

describe("buildRoomGraph", () => {
  it("collapses the two sides of a doorway into one edge with both labels", () => {
    const a = makeRoom(1, "A");
    const b = makeRoom(2, "B");
    link(a, Directions.North, b);

    const graph = buildRoomGraph([a, b]);

    expect(graph.edges).toHaveLength(1);
    expect(graph.edges[0].connections).toHaveLength(2);
    expect(graph.edges[0].connections.map((connection) => connection.direction)).toEqual([
      Directions.North,
      Directions.South,
    ]);
  });

  it("keeps distinct parallel connections between the same pair", () => {
    const a = makeRoom(1, "A");
    const b = makeRoom(2, "B");
    link(a, Directions.North, b);
    link(a, Directions.East, b);

    const graph = buildRoomGraph([a, b]);

    expect(graph.edges).toHaveLength(2);
  });
});

describe("resolveStartRoom", () => {
  it("prefers the configured section start room", () => {
    const a = makeRoom(1, "A");
    const b = makeRoom(2, "B");
    expect(resolveStartRoom([a, b], { id: 1, name: "One", startRoomId: 2 })).toBe(b);
  });

  it("falls back to the lowest id when unset or missing", () => {
    const a = makeRoom(3, "A");
    const b = makeRoom(2, "B");
    expect(resolveStartRoom([a, b], { id: 1, name: "One", startRoomId: null })).toBe(b);
    expect(resolveStartRoom([a, b], { id: 1, name: "One", startRoomId: 99 })).toBe(b);
  });
});

describe("computeSectionLayout", () => {
  it("lays out a cycle without duplicating edges or looping forever", () => {
    const a = makeRoom(1, "A");
    const b = makeRoom(2, "B");
    const c = makeRoom(3, "C");
    link(a, Directions.North, b);
    link(b, Directions.East, c);
    link(c, Directions.South, a);

    const layout = computeSectionLayout([a, b, c], {
      id: 1,
      name: "Cycle",
      startRoomId: 1,
    });

    expect(layout.nodes).toHaveLength(3);
    expect(layout.edges).toHaveLength(3);
    expect(layout.unplaced).toHaveLength(0);
    expect(layout.startRoomId).toBe(1);
    expect(layout.nodes.find((node) => node.isStart)?.room.id).toBe(1);
  });

  it("returns islands in the unplaced lane instead of hiding them", () => {
    const a = makeRoom(1, "A");
    const b = makeRoom(2, "B");
    const island = makeRoom(3, "Island");
    link(a, Directions.North, b);

    const layout = computeSectionLayout([a, b, island], { id: 1, name: "One", startRoomId: 1 });

    expect(layout.nodes).toHaveLength(2);
    expect(layout.unplaced.map((room) => room.id)).toEqual([3]);
  });

  it("uses saved map positions as drag overrides", () => {
    const a = makeRoom(1, "A");
    const b = makeRoom(2, "B", 1, { mapX: 5, mapY: -3 });
    link(a, Directions.East, b);

    const layout = computeSectionLayout([a, b], { id: 1, name: "One", startRoomId: 1 });
    const node = layout.nodes.find((candidate) => candidate.room.id === 2);

    expect(node?.x).toBe(5);
    expect(node?.y).toBe(-3);
    expect(node?.isOverride).toBe(true);
    expect(layout.bounds.maxX).toBe(5);
    expect(layout.bounds.minY).toBe(-3);
  });

  it("resolves override collisions deterministically", () => {
    const a = makeRoom(1, "A", 1, { mapX: 0, mapY: 0 });
    const b = makeRoom(2, "B", 1, { mapX: 0, mapY: 0 });
    link(a, Directions.North, b);

    const layout = computeSectionLayout([a, b], { id: 1, name: "One", startRoomId: 1 });
    const positions = layout.nodes.map((node) => `${node.x},${node.y}`);

    expect(new Set(positions).size).toBe(2);
  });
});

describe("computeRealmLayout", () => {
  const sections: Section[] = [
    { id: 1, name: "One", startRoomId: 2 },
    { id: 2, name: "Two", startRoomId: 3 },
  ];

  it("filters to one section when requested", () => {
    const rooms = [
      makeRoom(1, "A", 1),
      makeRoom(2, "B", 1),
      makeRoom(3, "C", 2),
      makeRoom(4, "D", 2),
    ];

    const layouts = computeRealmLayout(rooms, sections, 2);

    expect(layouts).toHaveLength(1);
    expect(layouts[0].sectionId).toBe(2);
    expect(layouts[0].nodes.map((node) => node.room.id)).toEqual([3]);
    expect(layouts[0].unplaced.map((room) => room.id)).toEqual([4]);
  });

  it("includes an unassigned lane for rooms without a section", () => {
    const rooms = [makeRoom(1, "A", 1), makeRoom(9, "Loose", 0)];

    const layouts = computeRealmLayout(rooms, sections);

    expect(layouts.map((layout) => layout.sectionId)).toEqual([1, null]);
    expect(layouts[1].unplaced).toHaveLength(0);
    expect(layouts[1].startRoomId).toBe(9);
  });
});
