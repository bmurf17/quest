import { supabase } from "@/lib/supabase";
import { directionToDbEnum, oppositeDirection } from "@/lib/directions";
import { Directions } from "@/types/Directions";

export type RoomInteractionWrite =
  | { type: "none" }
  | {
      type: "NPC";
      name: string;
      dialogue: string[];
      discoveryMessage: string | null;
    }
  | {
      type: "chest";
      itemId: string;
      quantity: number;
      isLocked: boolean;
      discoveryMessage: string | null;
    }
  | {
      type: "camp";
      healAmount: number;
      restoresMana: boolean;
      cost: number | null;
      discoveryMessage: string | null;
    }
  | {
      type: "transition";
      destination: "next_dungeon" | "sanctuary";
      discoveryMessage: string | null;
    }
  | {
      type: "cutscene";
      cutsceneId: string;
      discoveryMessage: string | null;
    };

interface ExistingInteraction {
  id: number;
  npc_id: number | null;
  chest_id: number | null;
  camp_id: number | null;
  transition_id: number | null;
}

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

/** Replace the library enemies attached to a room. */
export async function setRoomEnemies(roomId: number, enemyIds: number[]): Promise<void> {
  const nextIds = [...new Set(enemyIds)];

  const { error: deleteError } = await supabase.from("room_enemies").delete().eq("room_id", roomId);

  if (deleteError) throw deleteError;
  if (nextIds.length === 0) return;

  const { error } = await supabase
    .from("room_enemies")
    .insert(nextIds.map((enemyId) => ({ room_id: roomId, enemy_id: enemyId })));

  if (error) throw error;
}

async function deleteInteractionChild(
  existing: ExistingInteraction | null,
  keep: "npc" | "chest" | "camp" | "transition" | null,
): Promise<void> {
  if (!existing) return;

  if (keep !== "npc" && existing.npc_id) {
    const { error } = await supabase.from("npcs").delete().eq("id", existing.npc_id);
    if (error) throw error;
  }
  if (keep !== "chest" && existing.chest_id) {
    const { error } = await supabase.from("chests").delete().eq("id", existing.chest_id);
    if (error) throw error;
  }
  if (keep !== "camp" && existing.camp_id) {
    const { error } = await supabase.from("camps").delete().eq("id", existing.camp_id);
    if (error) throw error;
  }
  if (keep !== "transition" && existing.transition_id) {
    const { error } = await supabase.from("transitions").delete().eq("id", existing.transition_id);
    if (error) throw error;
  }
}

/**
 * Create, update, or remove the interaction attached to a room. Child rows
 * (NPC, chest, camp, transition) are updated in place where possible so quests
 * and open chest state survive an edit; stale children from a type change are
 * deleted afterwards.
 */
export async function saveRoomInteraction(
  roomId: number,
  input: RoomInteractionWrite,
): Promise<void> {
  const { data: existingRow, error: readError } = await supabase
    .from("room_interactions")
    .select("id, npc_id, chest_id, camp_id, transition_id")
    .eq("room_id", roomId)
    .maybeSingle();

  if (readError) throw readError;
  const existing = (existingRow ?? null) as ExistingInteraction | null;

  if (input.type === "none") {
    if (!existing) return;

    const { error: deleteError } = await supabase
      .from("room_interactions")
      .delete()
      .eq("id", existing.id);
    if (deleteError) throw deleteError;

    await deleteInteractionChild(existing, null);
    return;
  }

  const payload: {
    interaction_type: Exclude<RoomInteractionWrite["type"], "none">;
    npc_id: number | null;
    chest_id: number | null;
    camp_id: number | null;
    transition_id: number | null;
    cutscene_id: string | null;
    discovery_message: string | null;
  } = {
    interaction_type: input.type,
    npc_id: null,
    chest_id: null,
    camp_id: null,
    transition_id: null,
    cutscene_id: null,
    discovery_message: null,
  };

  if (input.type === "NPC") {
    if (existing?.npc_id) {
      const { error } = await supabase
        .from("npcs")
        .update({
          name: input.name,
          dialogue: input.dialogue,
          discovery_message: input.discoveryMessage,
        })
        .eq("id", existing.npc_id);
      if (error) throw error;
      payload.npc_id = existing.npc_id;
    } else {
      const { data, error } = await supabase
        .from("npcs")
        .insert({
          name: input.name,
          dialogue: input.dialogue,
          discovery_message: input.discoveryMessage,
        })
        .select("id")
        .single();
      if (error) throw error;
      payload.npc_id = data.id;
    }
  } else if (input.type === "chest") {
    if (existing?.chest_id) {
      const { error } = await supabase
        .from("chests")
        .update({
          item_id: input.itemId,
          quantity: input.quantity,
          is_locked: input.isLocked,
          discovery_message: input.discoveryMessage,
        })
        .eq("id", existing.chest_id);
      if (error) throw error;
      payload.chest_id = existing.chest_id;
    } else {
      const { data, error } = await supabase
        .from("chests")
        .insert({
          item_id: input.itemId,
          quantity: input.quantity,
          is_locked: input.isLocked,
          discovery_message: input.discoveryMessage,
        })
        .select("id")
        .single();
      if (error) throw error;
      payload.chest_id = data.id;
    }
  } else if (input.type === "camp") {
    if (existing?.camp_id) {
      const { error } = await supabase
        .from("camps")
        .update({
          heal_amount: input.healAmount,
          restores_mana: input.restoresMana,
          cost: input.cost,
          discovery_message: input.discoveryMessage,
        })
        .eq("id", existing.camp_id);
      if (error) throw error;
      payload.camp_id = existing.camp_id;
    } else {
      const { data, error } = await supabase
        .from("camps")
        .insert({
          heal_amount: input.healAmount,
          restores_mana: input.restoresMana,
          cost: input.cost,
          discovery_message: input.discoveryMessage,
        })
        .select("id")
        .single();
      if (error) throw error;
      payload.camp_id = data.id;
    }
  } else if (input.type === "transition") {
    if (existing?.transition_id) {
      const { error } = await supabase
        .from("transitions")
        .update({
          destination: input.destination,
          discovery_message: input.discoveryMessage,
        })
        .eq("id", existing.transition_id);
      if (error) throw error;
      payload.transition_id = existing.transition_id;
    } else {
      const { data, error } = await supabase
        .from("transitions")
        .insert({
          destination: input.destination,
          discovery_message: input.discoveryMessage,
        })
        .select("id")
        .single();
      if (error) throw error;
      payload.transition_id = data.id;
    }
  } else {
    payload.cutscene_id = input.cutsceneId;
    payload.discovery_message = input.discoveryMessage;
  }

  if (existing) {
    const { error } = await supabase
      .from("room_interactions")
      .update(payload)
      .eq("id", existing.id);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("room_interactions")
      .insert({ room_id: roomId, ...payload });
    if (error) throw error;
  }

  const keep =
    input.type === "NPC"
      ? "npc"
      : input.type === "chest"
        ? "chest"
        : input.type === "camp"
          ? "camp"
          : input.type === "transition"
            ? "transition"
            : null;
  await deleteInteractionChild(existing, keep);
}

const DIRECTION_NAMES: Record<Directions, string> = {
  [Directions.North]: "north",
  [Directions.West]: "west",
  [Directions.South]: "south",
  [Directions.East]: "east",
};
