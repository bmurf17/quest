import { useEffect, useRef, useState } from "react";
import mushroom from "/images/Mushroom.png";
import blord from "/images/Blord.png";
import { getRoomById, supabase } from "@/queries/RoomQueries";
import { createRoomWithExits } from "@/queries/AdminQueries";
import { getAdminEnemies } from "@/queries/AdminEnemyQueries";
import { createQuickDialogueTree, getAdminNpcSummaries } from "@/queries/AdminDialogueQueries";
import { useGameStore } from "@/state/GameState";
import { logger } from "@/lib/logger";
import { DIRECTION_OPTIONS } from "@/lib/directions";
import { Directions } from "@/types/Directions";
import type { Json } from "@/types/database.generated";
import {
  defaultQuickDialogueChoice,
  defaultQuickDialogueLine,
  type EnemyEntry,
  type ExistingNpcOption,
  type NpcSource,
  type QuickDialogueChoiceEntry,
  type QuickDialogueLineEntry,
} from "./formTypes";
import type { InteractionType } from "./interactionTypes";

interface ExitDraft {
  key: number;
  roomId: number | null;
  direction: Directions;
}

const firstExitFor = (rooms: { id: number }[], key: number): ExitDraft[] =>
  rooms.length > 0
    ? [{ key, roomId: rooms[0].id, direction: Directions.North }]
    : [{ key, roomId: null, direction: Directions.North }];

const getFormString = (formData: FormData, name: string, fallback = ""): string => {
  const value = formData.get(name);
  return typeof value === "string" ? value : fallback;
};

/** Supabase errors are plain objects, not Error instances. */
const describeError = (err: unknown, fallback = "unknown error"): string => {
  if (err instanceof Error) return err.message;
  if (err && typeof err === "object" && "message" in err) {
    const message = (err as { message?: unknown }).message;
    if (typeof message === "string" && message.length > 0) return message;
  }
  return fallback;
};

export function useCreateRoomForm() {
  const [interaction, setInteraction] = useState<InteractionType>("NPC");
  const [enemies, setEnemies] = useState<EnemyEntry[]>([]);
  const [libraryEnemies, setLibraryEnemies] = useState<EnemyEntry[]>([]);
  const [exits, setExits] = useState<ExitDraft[]>(() => firstExitFor([], 1));
  const [selectedSectionId, setSelectedSectionId] = useState<number | null>(null);
  const [npcSource, setNpcSource] = useState<NpcSource>("new");
  const [existingNpcs, setExistingNpcs] = useState<ExistingNpcOption[]>([]);
  const [selectedNpcId, setSelectedNpcId] = useState<number | null>(null);
  const [npcImg, setNpcImg] = useState("");
  const [quickLines, setQuickLines] = useState<QuickDialogueLineEntry[]>(() => [
    defaultQuickDialogueLine(1),
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // ref to synchronously guard against double-submit (rapid double-clicks)
  const submittingRef = useRef(false);
  const nextExitKeyRef = useRef(2);
  const nextQuickLineKeyRef = useRef(2);
  const nextQuickChoiceKeyRef = useRef(1);

  const rooms = useGameStore((state) => state.rooms);
  const availableSections = useGameStore((state) => state.availableSections);
  const addRoom = useGameStore((state) => state.addRoom);
  const updateRoom = useGameStore((state) => state.updateRoom);

  useEffect(() => {
    if (availableSections.length > 0 && selectedSectionId === null) {
      setSelectedSectionId(availableSections[0].id);
    }
  }, [availableSections, selectedSectionId]);

  useEffect(() => {
    let cancelled = false;
    void getAdminEnemies()
      .then((rows) => {
        if (cancelled) return;
        setLibraryEnemies(
          rows.map((row) => ({
            libraryId: row.id,
            name: row.name,
            health: row.health,
            strength: row.strength,
            dex: row.dex,
            defense: row.defense,
            img: row.img,
            expGain: row.exp_gain,
            type: row.type,
            maxHealth: row.max_health ?? undefined,
            phaseThresholds: row.phase_thresholds ?? [],
            moves: row.moves ?? [],
            spawns: (row.spawns ?? []) as EnemyEntry[],
          })),
        );
      })
      .catch(() => {
        // The library is optional here; room creation still supports new enemies.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    void getAdminNpcSummaries()
      .then((rows) => {
        if (cancelled) return;
        const options: ExistingNpcOption[] = rows.map((row) => ({
          id: row.id,
          name: row.name,
          npcType: row.npc_type,
          treeName: row.dialogueTreeName,
          hasTree: row.dialogueTreeId !== null,
        }));
        setExistingNpcs(options);
        setSelectedNpcId((current) => current ?? options[0]?.id ?? null);
      })
      .catch(() => {
        // The picker is optional; the new-NPC builder still works.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const updateQuickLine = (key: number, text: string) => {
    setQuickLines((current) =>
      current.map((line) => (line.key === key ? { ...line, text } : line)),
    );
  };

  const addQuickLine = () => {
    setQuickLines((current) => [
      ...current,
      defaultQuickDialogueLine(nextQuickLineKeyRef.current++),
    ]);
  };

  const removeQuickLine = (key: number) => {
    setQuickLines((current) =>
      current.length <= 1 ? current : current.filter((line) => line.key !== key),
    );
  };

  const addQuickChoice = (lineKey: number) => {
    setQuickLines((current) =>
      current.map((line) =>
        line.key === lineKey
          ? {
              ...line,
              choices: [
                ...line.choices,
                defaultQuickDialogueChoice(nextQuickChoiceKeyRef.current++),
              ],
            }
          : line,
      ),
    );
  };

  const removeQuickChoice = (lineKey: number, choiceKey: number) => {
    setQuickLines((current) =>
      current.map((line) =>
        line.key === lineKey
          ? { ...line, choices: line.choices.filter((choice) => choice.key !== choiceKey) }
          : line,
      ),
    );
  };

  const updateQuickChoice = (
    lineKey: number,
    choiceKey: number,
    values: Partial<QuickDialogueChoiceEntry>,
  ) => {
    setQuickLines((current) =>
      current.map((line) =>
        line.key === lineKey
          ? {
              ...line,
              choices: line.choices.map((choice) =>
                choice.key === choiceKey ? { ...choice, ...values } : choice,
              ),
            }
          : line,
      ),
    );
  };

  const resetQuickDialogue = () => {
    setQuickLines([defaultQuickDialogueLine(nextQuickLineKeyRef.current++)]);
  };

  const enemyImgs = [mushroom, blord];

  const directionOptions = DIRECTION_OPTIONS;
  const sectionRooms =
    selectedSectionId !== null ? rooms.filter((r) => r.sectionId === selectedSectionId) : rooms;

  useEffect(() => {
    if (exits.length > 0 && exits[0].roomId !== null) return;
    if (sectionRooms.length === 0) return;
    setExits(firstExitFor(sectionRooms, exits[0]?.key ?? 1));
  }, [exits, sectionRooms]);

  const handleSectionChange = (sectionId: number | null) => {
    setSelectedSectionId(sectionId);
    const nextRooms = sectionId !== null ? rooms.filter((r) => r.sectionId === sectionId) : rooms;
    const key = nextExitKeyRef.current++;
    setExits(firstExitFor(nextRooms, key));
  };

  const addExit = () => {
    const key = nextExitKeyRef.current++;
    const unusedRoom = sectionRooms.find((room) => !exits.some((exit) => exit.roomId === room.id));
    const usedDirections = new Set(exits.map((exit) => exit.direction));
    const nextDirection =
      directionOptions.find(({ value }) => !usedDirections.has(value))?.value ?? Directions.North;
    setExits((current) => [
      ...current,
      {
        key,
        roomId: unusedRoom?.id ?? sectionRooms[0]?.id ?? null,
        direction: nextDirection,
      },
    ]);
  };

  const removeExit = (key: number) => {
    setExits((current) => (current.length <= 1 ? current : current.filter((e) => e.key !== key)));
  };

  const updateExit = (key: number, values: Partial<Pick<ExitDraft, "roomId" | "direction">>) => {
    setExits((current) =>
      current.map((exit) => (exit.key === key ? { ...exit, ...values } : exit)),
    );
  };

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

      const plannedExits = exits
        .filter((exit): exit is ExitDraft & { roomId: number } => exit.roomId !== null)
        .map((exit) => {
          const target = rooms.find((room) => room.id === exit.roomId);
          if (!target) {
            throw new Error("One of the chosen connecting rooms no longer exists.");
          }
          return { ...exit, target };
        });

      const usedDirections = new Set<Directions>();
      for (const exit of plannedExits) {
        const label =
          DIRECTION_OPTIONS.find(({ value }) => value === exit.direction)?.label ?? "direction";
        if (usedDirections.has(exit.direction)) {
          throw new Error(`Two new exits both use the ${label.toLowerCase()} direction.`);
        }
        usedDirections.add(exit.direction);
        if (exit.target.neighboringRooms.some(([direction]) => direction === exit.direction)) {
          throw new Error(
            `"${exit.target.name}" already has a doorway to the ${label.toLowerCase()}.`,
          );
        }
      }

      const newRoomId = await createRoomWithExits({
        name: roomName,
        sectionId: selectedSectionId,
        exits: plannedExits.map((exit) => ({
          direction: exit.direction,
          targetRoomId: exit.target.id,
        })),
      });

      if (interaction === "Combat") {
        for (const enemy of enemies) {
          if (!enemy.name) continue;

          if (enemy.libraryId) {
            const { error: roomEnemyError } = await supabase
              .from("room_enemies")
              .insert({ room_id: newRoomId, enemy_id: enemy.libraryId });

            if (roomEnemyError)
              throw new Error(`Failed to link enemy to room: ${roomEnemyError.message}`);
            continue;
          }

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
        if (npcSource === "existing") {
          if (selectedNpcId === null) {
            throw new Error("Choose an existing NPC for this room, or create a new one.");
          }

          const { error: interactionError } = await supabase.from("room_interactions").insert({
            room_id: newRoomId,
            interaction_type: "NPC",
            npc_id: selectedNpcId,
          });

          if (interactionError) throw new Error(`Failed to link NPC: ${interactionError.message}`);
        } else {
          const npcName = getFormString(formData, "npcName").trim();
          const discoveryMessage = getFormString(formData, "discoveryMessage").trim();
          const lines = quickLines
            .map((line) => ({
              text: line.text.trim(),
              choices: line.choices.map((choice) => ({
                text: choice.text,
                outcomeType: choice.outcomeType,
                outcomeValue: choice.outcomeValue,
              })),
            }))
            .filter((line) => line.text.length > 0);

          if (!npcName) {
            throw new Error("Give the new NPC a name.");
          }
          if (lines.length === 0) {
            throw new Error("Add at least one dialogue line for the new NPC.");
          }

          const { data: npcData, error: npcError } = await supabase
            .from("npcs")
            .insert({
              name: npcName,
              dialogue: lines.map((line) => line.text),
              discovery_message: discoveryMessage || null,
              img: npcImg.trim(),
            })
            .select()
            .single();

          if (npcError) throw new Error(`Failed to create NPC: ${npcError.message}`);

          try {
            await createQuickDialogueTree(npcData.id, `${npcName} Dialogue`, lines);
          } catch (err) {
            // Do not leave an NPC with no room and a half-built conversation.
            await supabase.from("npcs").delete().eq("id", npcData.id);
            throw new Error(`Could not build the NPC dialogue: ${describeError(err)}`);
          }

          const { error: interactionError } = await supabase.from("room_interactions").insert({
            room_id: newRoomId,
            interaction_type: "NPC",
            npc_id: npcData.id,
          });

          if (interactionError) throw new Error(`Failed to link NPC: ${interactionError.message}`);
        }
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

      // Re-read the room from the database so the local copy includes its
      // enemies, interaction, and neighbour links instead of only the form's
      // NPC fields. Without this, newly created interactions appeared to
      // vanish until the page was refreshed.
      const createdRoom = await getRoomById(newRoomId);
      if (!createdRoom) {
        throw new Error("The room was created but could not be loaded.");
      }

      const refreshedNeighborIds = new Set(plannedExits.map((exit) => exit.target.id));
      for (const neighborId of refreshedNeighborIds) {
        const updatedNeighbor = await getRoomById(neighborId);
        if (updatedNeighbor) updateRoom(updatedNeighbor);
      }

      addRoom(createdRoom);
      showToast("success", `"${roomName}" has been etched into the map.`);
      (event.target as HTMLFormElement).reset();
      setExits(firstExitFor(sectionRooms, nextExitKeyRef.current++));
      resetQuickDialogue();
    } catch (err) {
      showToast("error", describeError(err, "An unknown error occurred"));
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
    libraryEnemies,
    exits,
    addExit,
    removeExit,
    updateExit,
    handleSectionChange,
    selectedSectionId,
    isSubmitting,
    toast,
    setToast,
    rooms,
    availableSections,
    npcSource,
    setNpcSource,
    existingNpcs,
    selectedNpcId,
    setSelectedNpcId,
    npcImg,
    setNpcImg,
    quickLines,
    addQuickLine,
    removeQuickLine,
    updateQuickLine,
    addQuickChoice,
    removeQuickChoice,
    updateQuickChoice,
    enemyImgs,
    directionOptions,
    sectionRooms,
    handleSubmit,
    showToast,
  };
}
