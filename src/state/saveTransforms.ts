import type { Room } from "@/types/Room";
import type { Directions } from "@/types/Directions";
import { SaveDataError } from "./saveSchema";

/**
 * A room as it is written to storage: neighbor references are room IDs rather
 * than nested room objects, which avoids cycles when serializing to JSON.
 */
export type SerializedRoom = Omit<Room, "neighboringRooms"> & {
  neighboringRooms: [Directions, number][];
};

export function normalizeNeighbors(room: Room): SerializedRoom {
  return {
    ...room,
    neighboringRooms: room.neighboringRooms.map(([dir, neighborRoom]: [Directions, Room]) => [
      dir,
      neighborRoom.id,
    ]),
  };
}

/**
 * Rebuild a room's neighbor references from a complete room lookup.
 *
 * Unlike the old behavior, a missing neighbor is an error rather than a
 * silently-created "Unknown" stub room: dangling IDs mean the save is corrupt
 * or an import is missing rooms, and hiding that makes data bugs harder to
 * find. Callers should populate the lookup with every room (including forward
 * references) before calling this.
 */
export function denormalizeNeighbors(room: SerializedRoom, roomLookup: Map<number, Room>): Room {
  return {
    ...room,
    neighboringRooms: room.neighboringRooms.map(([dir, neighborId]: [Directions, number]) => {
      const found = roomLookup.get(neighborId);
      if (!found) {
        throw new SaveDataError(
          `Room "${room.name}" (${room.id}) references missing neighboring room ${neighborId}`,
        );
      }
      return [dir, found];
    }),
  };
}

/**
 * Rebuild all saved room instances, linking neighbors in a second pass so
 * forward references resolve to the real (canonical) room objects.
 *
 * `roomLookup` is seeded with the current room templates and is extended with
 * every saved instance; missing neighbor IDs raise a {@link SaveDataError}.
 */
export function hydrateRoomInstances(
  serialized: [number, SerializedRoom][],
  roomLookup: Map<number, Room>,
): Map<number, Room> {
  const roomInstances = new Map<number, Room>();

  // Pass 1: create every room instance first so neighbor references can
  // point forwards as well as backwards.
  for (const [id, roomData] of serialized) {
    const room: Room = { ...roomData, neighboringRooms: [] };
    roomInstances.set(id, room);
    roomLookup.set(id, room);
  }

  // Pass 2: link neighbors now that the full lookup is available.
  for (const [id, roomData] of serialized) {
    const room = roomInstances.get(id);
    if (!room) continue;
    room.neighboringRooms = denormalizeNeighbors(roomData, roomLookup).neighboringRooms;
  }

  return roomInstances;
}
