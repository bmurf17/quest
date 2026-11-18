import { Directions } from "@/types/Directions";
import { oppositeDirection } from "@/lib/directions";
import type { Room, Section } from "@/types/Room";

/**
 * Pure graph + layout helpers for the Realm Map.
 *
 * Rooms are laid out on an integer grid: one compass step per cardinal
 * direction. Positions are converted to pixels by the renderer, keeping the
 * layout logic independent of zoom and viewport size.
 */

export interface RoomGraphConnection {
  fromId: number;
  toId: number;
  direction: Directions;
}

export interface RoomGraphEdge {
  key: string;
  aId: number;
  bId: number;
  connections: RoomGraphConnection[];
}

export interface RoomGraph {
  roomsById: Map<number, Room>;
  edges: RoomGraphEdge[];
  edgesByRoom: Map<number, RoomGraphEdge[]>;
  neighborsOf: Map<number, [Directions, Room][]>;
}

const directionOffset = (direction: Directions): [number, number] => {
  switch (direction) {
    case Directions.North:
      return [0, -1];
    case Directions.South:
      return [0, 1];
    case Directions.East:
      return [1, 0];
    case Directions.West:
      return [-1, 0];
  }
};

const directionOrder = (direction: Directions): number => {
  switch (direction) {
    case Directions.North:
      return 0;
    case Directions.East:
      return 1;
    case Directions.South:
      return 2;
    case Directions.West:
      return 3;
  }
};

/**
 * Build a flat, deduplicated graph from the nested room neighbours.
 *
 * `getAllRooms` stores both sides of a doorway (A East B and B West A). Those
 * two rows describe one physical connection, so they collapse into a single
 * edge while keeping both direction labels for the renderer. Rooms that link
 * to each other more than once produce one edge per distinct direction.
 */
export function buildRoomGraph(rooms: Room[]): RoomGraph {
  const roomsById = new Map(rooms.map((room) => [room.id, room]));
  const edges = new Map<string, RoomGraphEdge>();
  const neighborsOf = new Map<number, [Directions, Room][]>();

  for (const room of rooms) {
    const neighbors = (room.neighboringRooms ?? []).filter(([, neighbor]) =>
      roomsById.has(neighbor.id),
    );
    neighborsOf.set(room.id, neighbors);

    for (const [direction, neighbor] of neighbors) {
      const lowId = Math.min(room.id, neighbor.id);
      const highId = Math.max(room.id, neighbor.id);
      // Normalise the direction so the mirrored rows produce the same key.
      const normalizedDirection = room.id === lowId ? direction : oppositeDirection(direction);
      const key = `${lowId}:${highId}:${normalizedDirection}`;

      let edge = edges.get(key);
      if (!edge) {
        edge = { key, aId: lowId, bId: highId, connections: [] };
        edges.set(key, edge);
      }

      const duplicate = edge.connections.some(
        (connection) => connection.fromId === room.id && connection.direction === direction,
      );
      if (!duplicate) {
        edge.connections.push({ fromId: room.id, toId: neighbor.id, direction });
      }
    }
  }

  const edgesByRoom = new Map<number, RoomGraphEdge[]>();
  for (const edge of edges.values()) {
    for (const roomId of [edge.aId, edge.bId]) {
      const list = edgesByRoom.get(roomId) ?? [];
      list.push(edge);
      edgesByRoom.set(roomId, list);
    }
  }

  return { roomsById, edges: [...edges.values()], edgesByRoom, neighborsOf };
}

export interface LayoutNode {
  room: Room;
  x: number;
  y: number;
  isStart: boolean;
  isOverride: boolean;
}

export interface LayoutLabel {
  direction: Directions;
  /** Position along the edge, 0 = source node, 1 = destination node. */
  t: number;
  fromId: number;
  toId: number;
}

export interface LayoutEdge {
  key: string;
  aId: number;
  bId: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  labels: LayoutLabel[];
  parallelIndex: number;
  parallelCount: number;
}

export interface SectionLayout {
  sectionId: number | null;
  sectionName: string;
  startRoomId: number | null;
  nodes: LayoutNode[];
  edges: LayoutEdge[];
  /** Rooms that cannot be reached from the section start, or have no path. */
  unplaced: Room[];
  bounds: { minX: number; maxX: number; minY: number; maxY: number };
}

const positionKey = (x: number, y: number) => `${x},${y}`;

const hasOverride = (room: Room): boolean =>
  typeof room.mapX === "number" &&
  Number.isFinite(room.mapX) &&
  typeof room.mapY === "number" &&
  Number.isFinite(room.mapY);

/**
 * Find the closest free grid cell to a desired position. Used by the map's
 * "create room here" ghosts and by the auto-layout collision handling.
 */
export function findNearestFreeCell(
  desiredX: number,
  desiredY: number,
  occupied: ReadonlyMap<string, number>,
): [number, number] {
  if (!occupied.has(positionKey(desiredX, desiredY))) return [desiredX, desiredY];

  // Deterministic ring search: nearest first, then top-to-bottom/left-to-right.
  for (let radius = 1; radius < 40; radius += 1) {
    const candidates: [number, number][] = [];
    for (let dx = -radius; dx <= radius; dx += 1) {
      for (let dy = -radius; dy <= radius; dy += 1) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== radius) continue;
        candidates.push([desiredX + dx, desiredY + dy]);
      }
    }
    candidates.sort((a, b) => a[1] - b[1] || a[0] - b[0]);
    for (const [x, y] of candidates) {
      if (!occupied.has(positionKey(x, y))) return [x, y];
    }
  }

  // Practically unreachable, but never loop forever for a pathological graph.
  return [desiredX + occupied.size, desiredY + occupied.size];
}

/** Resolve the section's configured start room, falling back to lowest id. */
export function resolveStartRoom(rooms: Room[], section?: Section | null): Room | null {
  if (rooms.length === 0) return null;

  const configuredId = section?.startRoomId;
  if (configuredId != null) {
    const configured = rooms.find((room) => room.id === configuredId);
    if (configured) return configured;
  }

  return [...rooms].sort((a, b) => a.id - b.id)[0];
}

/**
 * Compass auto-layout for one section.
 *
 * Saved `map_x`/`map_y` values win over the computed position. Rooms that
 * cannot be reached from the start room are returned in `unplaced` so the map
 * can show them in a lane instead of silently hiding them.
 */
export function computeSectionLayout(
  rooms: Room[],
  section: Section | null,
  graph: RoomGraph = buildRoomGraph(rooms),
): SectionLayout {
  const sectionRooms = rooms;
  const start = resolveStartRoom(sectionRooms, section);
  const nodes: LayoutNode[] = [];
  const unplaced: Room[] = [];
  const bounds = { minX: 0, maxX: 0, minY: 0, maxY: 0 };
  const sectionName = section?.name ?? "Unassigned";

  if (!start) {
    return {
      sectionId: section?.id ?? null,
      sectionName,
      startRoomId: null,
      nodes,
      edges: [],
      unplaced,
      bounds,
    };
  }

  const occupied = new Map<string, number>();
  const placed = new Map<number, LayoutNode>();
  const queue: Room[] = [start];

  const place = (room: Room, desiredX: number, desiredY: number): LayoutNode => {
    let x = desiredX;
    let y = desiredY;
    if (occupied.has(positionKey(x, y))) {
      [x, y] = findNearestFreeCell(x, y, occupied);
    }
    occupied.set(positionKey(x, y), room.id);

    const node: LayoutNode = {
      room,
      x,
      y,
      isStart: room.id === start.id,
      isOverride: hasOverride(room),
    };
    placed.set(room.id, node);
    nodes.push(node);
    bounds.minX = Math.min(bounds.minX, x);
    bounds.maxX = Math.max(bounds.maxX, x);
    bounds.minY = Math.min(bounds.minY, y);
    bounds.maxY = Math.max(bounds.maxY, y);
    return node;
  };

  const startX = hasOverride(start) ? (start.mapX as number) : 0;
  const startY = hasOverride(start) ? (start.mapY as number) : 0;
  place(start, startX, startY);

  while (queue.length > 0) {
    const room = queue.shift()!;
    const node = placed.get(room.id);
    if (!node) continue;

    const neighbors = [...(graph.neighborsOf.get(room.id) ?? [])].sort(
      ([a], [b]) => directionOrder(a) - directionOrder(b),
    );

    for (const [direction, neighbor] of neighbors) {
      if (placed.has(neighbor.id)) continue;
      // Neighbours outside this section belong to another layout.
      if (!sectionRooms.some((candidate) => candidate.id === neighbor.id)) continue;

      const [dx, dy] = directionOffset(direction);
      const desiredX = hasOverride(neighbor) ? (neighbor.mapX as number) : node.x + dx;
      const desiredY = hasOverride(neighbor) ? (neighbor.mapY as number) : node.y + dy;
      place(neighbor, desiredX, desiredY);
      queue.push(neighbor);
    }
  }

  for (const room of sectionRooms) {
    if (!placed.has(room.id)) unplaced.push(room);
  }

  // Count parallel connections between the same pair so the renderer can
  // curve them apart instead of drawing them on top of each other.
  const pairCounts = new Map<string, number>();
  for (const edge of graph.edges) {
    const pairKey = `${edge.aId}:${edge.bId}`;
    pairCounts.set(pairKey, (pairCounts.get(pairKey) ?? 0) + 1);
  }

  const edges: LayoutEdge[] = [];
  graph.edges.forEach((edge) => {
    const a = placed.get(edge.aId);
    const b = placed.get(edge.bId);
    if (!a || !b) return;

    const pairKey = `${edge.aId}:${edge.bId}`;
    const parallelCount = pairCounts.get(pairKey) ?? 1;
    const parallelIndex = edges.filter((candidate) => {
      const samePair =
        (candidate.aId === edge.aId && candidate.bId === edge.bId) ||
        (candidate.aId === edge.bId && candidate.bId === edge.aId);
      return samePair;
    }).length;

    edges.push({
      key: edge.key,
      aId: edge.aId,
      bId: edge.bId,
      x1: a.x,
      y1: a.y,
      x2: b.x,
      y2: b.y,
      labels: edge.connections
        .filter((connection) => placed.has(connection.fromId))
        .map((connection) => ({
          direction: connection.direction,
          fromId: connection.fromId,
          toId: connection.toId,
          // Label each direction near its own room so mirrored exits read
          // correctly ("N" by the north room, "S" by the south room).
          t: connection.fromId === edge.aId ? 0.18 : 0.82,
        })),
      parallelIndex,
      parallelCount,
    });
  });

  return {
    sectionId: section?.id ?? null,
    sectionName,
    startRoomId: start.id,
    nodes,
    edges,
    unplaced,
    bounds,
  };
}

/**
 * Layout every section, or only the selected one. Sections are returned in id
 * order; rooms with no matching section share an "Unassigned" layout.
 */
export function computeRealmLayout(
  rooms: Room[],
  sections: Section[],
  selectedSectionId?: number | null,
): SectionLayout[] {
  if (selectedSectionId != null) {
    const section = sections.find((candidate) => candidate.id === selectedSectionId) ?? null;
    const sectionRooms = rooms.filter((room) => room.sectionId === selectedSectionId);
    return [computeSectionLayout(sectionRooms, section)];
  }

  const layouts: SectionLayout[] = [];
  const knownSectionIds = new Set(sections.map((section) => section.id));
  const sortedSections = [...sections].sort((a, b) => a.id - b.id);

  for (const section of sortedSections) {
    const sectionRooms = rooms.filter((room) => room.sectionId === section.id);
    if (sectionRooms.length === 0) continue;
    layouts.push(computeSectionLayout(sectionRooms, section));
  }

  const unassigned = rooms.filter((room) => !knownSectionIds.has(room.sectionId));
  if (unassigned.length > 0) {
    layouts.push(computeSectionLayout(unassigned, null));
  }

  return layouts;
}
