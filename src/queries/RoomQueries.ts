import { Directions } from "@/types/Directions";
import { Enemy } from "@/types/Enemy";
import { Room, Section } from "@/types/Room";
import { RoomInteraction } from "@/types/RoomInteractions";
import { supabase } from "@/lib/supabase";
export { supabase };

export async function getAllRooms(): Promise<Room[]> {
  const { data: rooms, error: roomsError } = await supabase
    .from("rooms")
    .select("*")
    .order("id");

  if (roomsError) throw roomsError;

  const [enemiesData, neighborsData, interactionsData] = await Promise.all([
    supabase
      .from("room_enemies")
      .select("room_id, enemies(*)")
      .then(({ data, error }) => {
        if (error) throw error;
        return data;
      }),

    supabase
      .from("neighboring_rooms")
      .select("room_id, direction, neighbor_room_id")
      .then(({ data, error }) => {
        if (error) throw error;
        return data;
      }),

    supabase
      .from("room_interactions")
      .select(
        `
        room_id,
        interaction_type,
        npcs(
          *,
          quest:quests(
            *,
            objectives:quest_objectives(*),
            rewards:quest_rewards(item:items(*))
          )
        ),
        chests(*, item:items(*)),
        camps(*),
        transitions(*)
        `,
      )
      .then(({ data, error }) => {
        if (error) throw error;
        return data;
      }),
  ]);

  const enemiesByRoom = new Map<number, Enemy[]>();
  enemiesData?.forEach((re) => {
    if (!enemiesByRoom.has(re.room_id)) {
      enemiesByRoom.set(re.room_id, []);
    }
    if (re.enemies) {
      enemiesByRoom.get(re.room_id)!.push(re.enemies as unknown as Enemy);
    }
  });

  const neighborsByRoom = new Map<number, [Directions, number][]>();
  neighborsData?.forEach((nr) => {
    if (!neighborsByRoom.has(nr.room_id)) {
      neighborsByRoom.set(nr.room_id, []);
    }
    neighborsByRoom
      .get(nr.room_id)!
      .push([nr.direction as Directions, nr.neighbor_room_id]);
  });

  const interactionsByRoom = new Map<number, any>();
  interactionsData?.forEach((ri) => {
    interactionsByRoom.set(ri.room_id, ri);
  });

  type RoomWithNeighborIds = Omit<Room, "neighboringRooms"> & {
    id: number;
    neighboringRooms: [Directions, number][];
  };

  const roomObjects: RoomWithNeighborIds[] = await Promise.all(
    rooms!.map(async (room) => {
      let interaction: RoomInteraction | null = null;
      const interactionData = interactionsByRoom.get(room.id);

      if (interactionData) {
        switch (interactionData.interaction_type) {
          case "NPC": {
            let mappedQuest: any | undefined = undefined;
            if (interactionData.npcs.quest) {
              const q = interactionData.npcs.quest;
              const mapItem = (it: any) =>
                it
                  ? {
                      name: it.name,
                      value: it.value,
                      img: it.img,
                      type: it.type,
                      effect: it.effect,
                      hpChange: it.hp_change,
                      manaChange: it.mana_change,
                      stackSize: it.stack_size,
                      slot: it.slot,
                      cost: it.cost,
                      stats: it.stats,
                      action: it.action,
                    }
                  : null;

              let questTypeObj: any;
              switch (q.quest_type) {
                case "fetch":
                  questTypeObj = {
                    type: "fetch",
                    item: mapItem(q.fetch_item),
                  };
                  break;
                case "defeat":
                  questTypeObj = {
                    type: "defeat",
                    enemy: await getEnemyById(q.defeat_enemy_id),
                  };
                  break;
                case "explore":
                  questTypeObj = {
                    type: "explore",
                    requireRoom: q.explore_room
                      ? {
                          id: q.explore_room.id,
                          name: q.explore_room.name,
                          sectionId: q.explore_room.section_id,
                          enemies: [],
                          neighboringRooms: [],
                          interaction: null,
                        }
                      : ({ id: q.explore_room_id } as any),
                  };
                  break;
                default:
                  questTypeObj = { type: "fetch", item: null };
              }

              mappedQuest = {
                id: q.id,
                name: q.name,
                description: q.description,
                type: questTypeObj,
                objectives: q.objectives
                  ? q.objectives.map((o: any) => o.objective)
                  : [],
                rewards: q.rewards
                  ? q.rewards
                      .map((r: any) => (r.item ? mapItem(r.item) : null))
                      .filter(Boolean)
                  : [],
                accepted: false,
                completed: false,
              };
            }

            interaction = {
              type: "NPC",
              npc: {
                id: interactionData.npcs.id,
                name: interactionData.npcs.name,
                dialogue: interactionData.npcs.dialogue,
                discoveryMessage: interactionData.npcs.discovery_message,
                NPCType: interactionData.npcs.npc_type,
                img: interactionData.npcs.img,
                quest: mappedQuest,
              },
            };
            break;
          }
          case "chest":
            interaction = {
              type: "chest",
              chest: {
                id: interactionData.chests.id,
                itemId: interactionData.chests.item_id,
                quantity: interactionData.chests.quantity,
                isLocked: interactionData.chests.is_locked,
                isOpen: interactionData.chests.is_open,
                discoveryMessage: interactionData.chests.discovery_message,
                item: interactionData.chests.item
                  ? {
                      name: interactionData.chests.item.name,
                      value: interactionData.chests.item.value,
                      img: interactionData.chests.item.img,
                      type: interactionData.chests.item.type,
                      effect: interactionData.chests.item.effect,
                      hpChange: interactionData.chests.item.hp_change,
                      manaChange: interactionData.chests.item.mana_change,
                      stackSize: interactionData.chests.item.stack_size,
                      slot: interactionData.chests.item.slot,
                      cost: interactionData.chests.item.cost,
                      stats: interactionData.chests.item.stats,
                      action: interactionData.chests.item.action,
                    }
                  : null,
              },
            };
            break;
          case "camp":
            interaction = {
              type: "camp",
              camp: {
                healAmount: interactionData.camps.heal_amount,
                restoresMana: interactionData.camps.restores_mana,
                cost: interactionData.camps.cost,
                discoveryMessage: interactionData.camps.discovery_message,
              },
            };
            break;
          case "transition":
            interaction = {
              type: "transition",
              transition: {
                destination: interactionData.transitions.destination,
                discoveryMessage:
                  interactionData.transitions.discovery_message ?? undefined,
                sanctuaryAvailable:
                  interactionData.transitions.sanctuary_available ?? undefined,
              },
            };
            break;
          case "cutscene":
            interaction = {
              type: "cutscene",
              cutscene: {
                cutsceneId: "intro",
                discoveryMessage:
                  interactionData.discovery_message ?? undefined,
              },
            };
            break;
        }
      }

      const neighbors = neighborsByRoom.get(room.id) || [];
      const neighboringRooms: [Directions, number][] = neighbors.map(
        ([dirStr, roomId]) => {
          const direction =
            Directions[dirStr as unknown as keyof typeof Directions];
          return [direction, roomId];
        },
      );

      return {
        id: room.id,
        name: room.name,
        sectionId: room.section_id,
        enemies: enemiesByRoom.get(room.id) || [],
        neighboringRooms,
        interaction,
      };
    }),
  );
  const roomMap = new Map<number, Room>();

  const finalRooms: Room[] = roomObjects.map((roomObj) => ({
    name: roomObj.name,
    sectionId: roomObj.sectionId,
    enemies: roomObj.enemies,
    neighboringRooms: [] as [Directions, Room][],
    interaction: roomObj.interaction,
    id: roomObj.id,
  }));

  roomObjects.forEach((roomObj, index) => {
    roomMap.set(roomObj.id, finalRooms[index]);
  });

  roomObjects.forEach((roomObj, index) => {
    finalRooms[index].neighboringRooms = roomObj.neighboringRooms.map(
      ([direction, roomId]) => [direction, roomMap.get(roomId)!],
    ) as [Directions, Room][];
  });

  return finalRooms;
}

export async function getRoomById(roomId: number): Promise<Room | null> {
  const rooms = await getAllRooms();
  return rooms.find((r) => r.id === roomId) || null;
}

export async function getRoomByName(name: string): Promise<Room | null> {
  const rooms = await getAllRooms();
  return rooms.find((r) => r.name === name) || null;
}

export async function getSections(): Promise<Section[]> {
  const { data, error } = await supabase
    .from("sections")
    .select("id, name")
    .order("id");

  if (error) throw error;
  return data as Section[];
}

export async function getRoomsBySection(sectionId: number): Promise<Room[]> {
  const allRooms = await getAllRooms();
  return allRooms.filter((r) => r.sectionId === sectionId);
}

export async function getEnemyById(enemyId: number): Promise<Enemy | null> {
  const { data, error } = await supabase
    .from("enemies")
    .select("id, name, health")
    .eq("id", enemyId)
    .single();

  if (error) throw error;
  return data as unknown as Enemy | null;
}
