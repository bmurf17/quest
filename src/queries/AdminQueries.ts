import { supabase } from "@/lib/supabase";
import { directionToDbEnum, oppositeDirection } from "@/lib/directions";
import { Directions } from "@/types/Directions";

/**
 * Admin mutations for world content. Components never talk to Supabase
 * directly, so the room editor goes through these helpers.
 */

export async function updateRoomBasics(
  roomId: number,
  values: { name: string; sectionId: number | null },
): Promise<void> {
  const { error } = await supabase
    .from("rooms")
    .update({ name: values.name, section_id: values.sectionId })
    .eq("id", roomId);

  if (error) throw error;
}

export async function deleteRoom(roomId: number): Promise<void> {
  const { error } = await supabase.from("rooms").delete().eq("id", roomId);

  if (error) throw error;
}

async function directionInUse(roomId: number, direction: Directions): Promise<boolean> {
  const { data, error } = await supabase
    .from("neighboring_rooms")
    .select("id")
    .eq("room_id", roomId)
    .eq("direction", directionToDbEnum(direction));

  if (error) throw error;
  return (data?.length ?? 0) > 0;
}

/**
 * Links two rooms in both directions. Refuses to create a one-way link or
 * overwrite an existing doorway, which keeps the map graph consistent.
 */
export async function linkRooms(
  roomId: number,
  neighborRoomId: number,
  direction: Directions,
): Promise<void> {
  const reverse = oppositeDirection(direction);

  if (await directionInUse(roomId, direction)) {
    throw new Error(`This room already has a doorway to the ${DIRECTION_NAMES[direction]}.`);
  }
  if (await directionInUse(neighborRoomId, reverse)) {
    throw new Error(
      `The destination already has a doorway to the ${DIRECTION_NAMES[reverse]}. Pick another room or direction.`,
    );
  }

  const { error } = await supabase.from("neighboring_rooms").insert([
    {
      room_id: roomId,
      neighbor_room_id: neighborRoomId,
      direction: directionToDbEnum(direction),
    },
    {
      room_id: neighborRoomId,
      neighbor_room_id: roomId,
      direction: directionToDbEnum(reverse),
    },
  ]);

  if (error) throw error;
}

/** Removes both sides of a doorway so the graph stays symmetrical. */
export async function unlinkRooms(
  roomId: number,
  neighborRoomId: number,
  direction: Directions,
): Promise<void> {
  const reverse = oppositeDirection(direction);

  const { error: outboundError } = await supabase
    .from("neighboring_rooms")
    .delete()
    .eq("room_id", roomId)
    .eq("direction", directionToDbEnum(direction));

  if (outboundError) throw outboundError;

  const { error: inboundError } = await supabase
    .from("neighboring_rooms")
    .delete()
    .eq("room_id", neighborRoomId)
    .eq("direction", directionToDbEnum(reverse));

  if (inboundError) throw inboundError;
}

const DIRECTION_NAMES: Record<Directions, string> = {
  [Directions.North]: "north",
  [Directions.West]: "west",
  [Directions.South]: "south",
  [Directions.East]: "east",
};
