import { useEffect, useRef, useState } from "react";
import mushroom from "/images/Mushroom.png";
import blord from "/images/Blord.png";
import { getRoomById, supabase } from "@/queries/RoomQueries";
import { useGameStore } from "@/state/GameState";
import { logger } from "@/lib/logger";
import { Directions } from "@/types/Directions";
import { startRoom } from "@/data/fixtures/rooms";
import type { Json, Database } from "@/types/database.generated";
import type { EnemyEntry } from "./formTypes";
import type { InteractionType } from "./interactionTypes";

type DirectionEnum = Database["public"]["Enums"]["direction_enum"];

const directionToDbEnum = (direction: Directions): DirectionEnum => {
  const map: { [key in Directions]: DirectionEnum } = {
    [Directions.North]: "North",
    [Directions.South]: "South",
    [Directions.East]: "East",
    [Directions.West]: "West",
  };
  return map[direction];
};

const getOppositeDirection = (direction: Directions): Directions => {
  const opposites: { [key in Directions]: Directions } = {
    [Directions.North]: Directions.South,
    [Directions.South]: Directions.North,
    [Directions.East]: Directions.West,
    [Directions.West]: Directions.East,
  };
  return opposites[direction];
};

const getFormString = (formData: FormData, name: string, fallback = ""): string => {
  const value = formData.get(name);
  return typeof value === "string" ? value : fallback;
};

export function useCreateRoomForm() {
  const [interaction, setInteraction] = useState<InteractionType>("NPC");
  const [enemies, setEnemies] = useState<EnemyEntry[]>([]);
  const [neighboringRoom, setNeighboringRoom] = useState(startRoom);
  const [selectedSectionId, setSelectedSectionId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // ref to synchronously guard against double-submit (rapid double-clicks)
  const submittingRef = useRef(false);

  const rooms = useGameStore((state) => state.rooms);
  const availableSections = useGameStore((state) => state.availableSections);
  const addRoom = useGameStore((state) => state.addRoom);
  const updateRoom = useGameStore((state) => state.updateRoom);

  useEffect(() => {
    if (availableSections.length > 0 && selectedSectionId === null) {
      setSelectedSectionId(availableSections[0].id);
    }
  }, [availableSections, selectedSectionId]);

  const enemyImgs = [mushroom, blord];

  const directionOptions = Object.entries(Directions)
    .filter(([, value]) => typeof value === "string")
    .map(([key, value]) => ({ label: value as string, value: key }));

  const sectionRooms =
    selectedSectionId !== null ? rooms.filter((r) => r.sectionId === selectedSectionId) : rooms;

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Prevent concurrent submissions (state updates are async; use ref for sync guard)
    if (submittingRef.current) return;
    submittingRef.current = true;
    setIsSubmitting(true);

    try {
      const formData = new FormData(event.currentTarget);
      const roomName = getFormString(formData, "name");
      const direction = formData.get("direction");

      const { data: newRoomData, error: roomError } = await supabase
        .from("rooms")
        .insert({ name: roomName, section_id: selectedSectionId })
        .select()
        .single();

      if (roomError) throw new Error(`Failed to create room: ${roomError.message}`);

      const newRoomId = newRoomData.id;

      if (interaction === "Combat") {
        for (const enemy of enemies) {
          if (!enemy.name) continue;

          const { data: enemyData, error: enemyError } = await supabase
            .from("enemies")
            .insert({
              name: enemy.name,
              health: enemy.health,
              strength: enemy.strength,
              dex: enemy.dex,
              defense: enemy.defense,
              img: enemy.img,
              exp_gain: enemy.expGain,
              type: enemy.type,
              max_health: enemy.maxHealth ?? null,
              phase_thresholds: enemy.phaseThresholds.length > 0 ? enemy.phaseThresholds : null,
              moves: enemy.moves.length > 0 ? (enemy.moves as unknown as Json) : null,
            })
            .select()
            .single();

          if (enemyError) throw new Error(`Failed to create enemy: ${enemyError.message}`);

          const { error: roomEnemyError } = await supabase
            .from("room_enemies")
            .insert({ room_id: newRoomId, enemy_id: enemyData.id });

          if (roomEnemyError)
            throw new Error(`Failed to link enemy to room: ${roomEnemyError.message}`);
        }
      } else if (interaction === "NPC") {
        const npcName = getFormString(formData, "npcName");
        const dialogue = getFormString(formData, "dialogue");
        const discoveryMessage = getFormString(formData, "discoveryMessage");

        const { data: npcData, error: npcError } = await supabase
          .from("npcs")
          .insert({
            name: npcName,
            dialogue: [dialogue],
            discovery_message: discoveryMessage,
          })
          .select()
          .single();

        if (npcError) throw new Error(`Failed to create NPC: ${npcError.message}`);

        const { error: interactionError } = await supabase.from("room_interactions").insert({
          room_id: newRoomId,
          interaction_type: "NPC",
          npc_id: npcData.id,
        });

        if (interactionError) throw new Error(`Failed to link NPC: ${interactionError.message}`);
      } else if (interaction === "Chest") {
        const itemId = getFormString(formData, "itemId");
        const quantity = parseInt(getFormString(formData, "quantity", "1"));
        const isLocked = formData.get("isLocked") === "true";

        const { data: chestData, error: chestError } = await supabase
          .from("chests")
          .insert({ item_id: itemId, quantity, is_locked: isLocked })
          .select()
          .single();

        if (chestError) throw new Error(`Failed to create chest: ${chestError.message}`);

        const { error: interactionError } = await supabase.from("room_interactions").insert({
          room_id: newRoomId,
          interaction_type: "chest",
          chest_id: chestData.id,
        });

        if (interactionError) throw new Error(`Failed to link chest: ${interactionError.message}`);
      } else if (interaction === "Camp") {
        const healAmount = parseInt(getFormString(formData, "healAmount", "50"));
        const restoresMana = formData.get("restoresMana") === "true";

        const { data: campData, error: campError } = await supabase
          .from("camps")
          .insert({ heal_amount: healAmount, restores_mana: restoresMana })
          .select()
          .single();

        if (campError) throw new Error(`Failed to create camp: ${campError.message}`);

        const { error: interactionError } = await supabase.from("room_interactions").insert({
          room_id: newRoomId,
          interaction_type: "camp",
          camp_id: campData.id,
        });

        if (interactionError) throw new Error(`Failed to link camp: ${interactionError.message}`);
      } else if (interaction === "Transition") {
        const destination = getFormString(formData, "destination", "next_dungeon");
        const discoveryMessage = getFormString(formData, "discoveryMessage");

        const { data: transitionData, error: transitionError } = await supabase
          .from("transitions")
          .insert({
            destination,
            discovery_message: discoveryMessage || null,
          })
          .select()
          .single();

        if (transitionError)
          throw new Error(`Failed to create transition: ${transitionError.message}`);

        const { error: interactionError } = await supabase.from("room_interactions").insert({
          room_id: newRoomId,
          interaction_type: "transition",
          transition_id: transitionData.id,
        });

        if (interactionError)
          throw new Error(`Failed to link transition: ${interactionError.message}`);
      }

      if (direction && neighboringRoom.id) {
        const directionEnum = +direction;
        const oppositeDirectionEnum = getOppositeDirection(directionEnum);

        const { error: neighborError1 } = await supabase.from("neighboring_rooms").insert({
          room_id: neighboringRoom.id,
          neighbor_room_id: newRoomId,
          direction: directionToDbEnum(directionEnum),
        });

        if (neighborError1) throw new Error(`Failed to link rooms: ${neighborError1.message}`);

        const { error: neighborError2 } = await supabase.from("neighboring_rooms").insert({
          room_id: newRoomId,
          neighbor_room_id: neighboringRoom.id,
          direction: directionToDbEnum(oppositeDirectionEnum),
        });

        if (neighborError2)
          throw new Error(`Failed to create reverse link: ${neighborError2.message}`);
      }

      // Re-read the room from the database so the local copy includes its
      // enemies, interaction, and neighbour links instead of only the form's
      // NPC fields. Without this, newly created interactions appeared to
      // vanish until the page was refreshed.
      const createdRoom = await getRoomById(newRoomId);
      if (!createdRoom) {
        throw new Error("The room was created but could not be loaded.");
      }

      if (direction) {
        const updatedNeighbor = await getRoomById(neighboringRoom.id);
        if (updatedNeighbor) updateRoom(updatedNeighbor);
      }

      addRoom(createdRoom);
      showToast("success", `"${roomName}" has been etched into the map.`);
      (event.target as HTMLFormElement).reset();
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "An unknown error occurred");
      logger.error("Error creating room:", err);
    } finally {
      setIsSubmitting(false);
      submittingRef.current = false;
    }
  };

  return {
    interaction,
    setInteraction,
    enemies,
    setEnemies,
    neighboringRoom,
    setNeighboringRoom,
    selectedSectionId,
    setSelectedSectionId,
    isSubmitting,
    toast,
    setToast,
    rooms,
    availableSections,
    enemyImgs,
    directionOptions,
    sectionRooms,
    handleSubmit,
    showToast,
  };
}
