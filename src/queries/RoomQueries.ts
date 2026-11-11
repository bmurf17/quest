import { Directions } from "@/types/Directions";
import { Enemy } from "@/types/Enemy";
import { Room, Section } from "@/types/Room";
import { NPCType, Quest, QuestType, RoomInteraction } from "@/types/RoomInteractions";
import { EquippableItem, EquipmentSlot, Item } from "@/types/Item";
import { supabase } from "@/lib/supabase";
export { supabase };

/** Shape of a row from the `enemies` table. */
interface DbEnemy {
  id: number;
  name: string;
  health: number;
  max_health: number | null;
  strength: number;
  dex: number;
  defense: number;
  img: string;
  exp_gain: number | null;
  type: "enemy" | "boss" | null;
  phase_thresholds: number[] | null;
  moves: Enemy["moves"] | null;
  spawns: Enemy["spawns"] | null;
}

/** Shape of a row from the `items` table. */
interface DbItem {
  name: string;
  value: number;
  img: string;
  type: "consumable" | "equipment";
  effect: string | null;
  hp_change: number | null;
  mana_change: number | null;
  target: "single" | "all" | null;
  stack_size: number | null;
  slot: EquipmentSlot | null;
  cost: number;
  stats: { attack?: number; defense?: number } | null;
  action: EquippableItem["action"] | null;
}

interface DbQuestObjective {
  objective: string;
}

interface DbQuestReward {
  item: DbItem | null;
}

interface DbExploreRoom {
  id: number;
  name: string;
  section_id: number;
}

interface DbQuest {
  id: number;
  name: string;
  description: string;
  quest_type: string;
  fetch_item: DbItem | null;
  defeat_enemy_id: number | null;
  explore_room: DbExploreRoom | null;
  explore_room_id: number | null;
  objectives: DbQuestObjective[] | null;
  rewards: DbQuestReward[] | null;
}

interface DbNpc {
  id: number;
  name: string;
  dialogue: string[];
  discovery_message: string | null;
  npc_type: string;
  img: string;
  quest: DbQuest | null;
}

interface DbChest {
  id: number;
  item_id: string;
  quantity: number;
  is_locked: boolean;
  is_open: boolean;
  discovery_message: string | null;
  item: DbItem | null;
}

interface DbCamp {
  heal_amount: number;
  restores_mana: boolean;
  cost: number | null;
  discovery_message: string | null;
}

interface DbTransition {
  destination: "next_dungeon" | "sanctuary";
  discovery_message: string | null;
  sanctuary_available: boolean | null;
}

interface DbRoomInteraction {
  room_id: number;
  interaction_type: string;
  discovery_message: string | null;
  npcs: DbNpc | null;
  chests: DbChest | null;
  camps: DbCamp | null;
  transitions: DbTransition | null;
}

const mapDbItem = (it: DbItem | null | undefined): Item | null => {
  if (!it) return null;

  const base = {
    name: it.name,
    value: it.value,
    img: it.img,
    cost: it.cost,
  };

  if (it.type === "consumable") {
    return {
      ...base,
      type: "consumable",
      effect: it.effect ?? "",
      hpChange: it.hp_change ?? 0,
      manaChange: it.mana_change ?? 0,
      target: it.target ?? "single",
      stackSize: it.stack_size ?? undefined,
    };
  }

  return {
    ...base,
    type: "equipment",
    slot: it.slot as EquipmentSlot,
    stats: it.stats ?? {},
    action: it.action ?? undefined,
  };
};

const mapDbEnemy = (e: DbEnemy): Enemy => ({
  id: e.id,
  name: e.name,
  health: e.health,
  maxHealth: e.max_health ?? undefined,
  strength: e.strength,
  dex: e.dex,
  defense: e.defense,
  img: e.img,
  expGain: e.exp_gain ?? 10,
  type: e.type ?? "enemy",
  phase: e.type === "boss" ? 1 : undefined,
  phaseThresholds: Array.isArray(e.phase_thresholds)
    ? e.phase_thresholds
    : undefined,
  moves: Array.isArray(e.moves) ? e.moves : undefined,
  spawns: Array.isArray(e.spawns) ? e.spawns : undefined,
});

const mapQuestType = async (q: DbQuest): Promise<QuestType> => {
  switch (q.quest_type) {
    case "fetch":
      return {
        type: "fetch",
        item: mapDbItem(q.fetch_item) as Item,
      };
    case "defeat":
      return {
        type: "defeat",
        enemy: (await getEnemyById(q.defeat_enemy_id ?? 0)) as Enemy,
      };
    case "explore":
      return {
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
          : ({ id: q.explore_room_id ?? 0 } as Room),
      };
    default:
      return { type: "fetch", item: null as unknown as Item };
  }
};

const mapDbQuest = async (q: DbQuest): Promise<Quest> => ({
  id: q.id,
  name: q.name,
  description: q.description,
  type: await mapQuestType(q),
  objectives: q.objectives ? q.objectives.map((o) => o.objective) : [],
  rewards: q.rewards
    ? q.rewards
        .map((r) => mapDbItem(r.item))
        .filter((item): item is Item => item !== null)
    : [],
  accepted: false,
  completed: false,
});

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
      enemiesByRoom.get(re.room_id)!.push(
        mapDbEnemy(re.enemies as unknown as DbEnemy),
      );
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

  const interactionsByRoom = new Map<number, DbRoomInteraction>();
  interactionsData?.forEach((ri) => {
    interactionsByRoom.set(ri.room_id, ri as unknown as DbRoomInteraction);
  });

  type RoomWithNeighborIds = Omit<Room, "neighboringRooms"> & {
    id: number;
    neighboringRooms: [Directions, number][];
  };

  const roomsData = rooms ?? [];

  const roomObjects: RoomWithNeighborIds[] = await Promise.all(
    roomsData.map(async (room) => {
      let interaction: RoomInteraction | null = null;
      const interactionData = interactionsByRoom.get(room.id);

      if (interactionData) {
        switch (interactionData.interaction_type) {
          case "NPC": {
            const npc = interactionData.npcs;
            if (!npc) break;

            const mappedQuest = npc.quest
              ? await mapDbQuest(npc.quest)
              : undefined;

            interaction = {
              type: "NPC",
              npc: {
                id: npc.id,
                name: npc.name,
                dialogue: npc.dialogue,
                discoveryMessage: npc.discovery_message ?? undefined,
                NPCType: npc.npc_type as NPCType,
                img: npc.img,
                quest: mappedQuest,
              },
            };
            break;
          }
          case "chest": {
            const chest = interactionData.chests;
            if (!chest) break;
            interaction = {
              type: "chest",
              chest: {
                id: chest.id,
                itemId: chest.item_id,
                quantity: chest.quantity,
                isLocked: chest.is_locked,
                isOpen: chest.is_open,
                discoveryMessage: chest.discovery_message,
                item: mapDbItem(chest.item),
              },
            };
            break;
          }
          case "camp": {
            const camp = interactionData.camps;
            if (!camp) break;
            interaction = {
              type: "camp",
              camp: {
                healAmount: camp.heal_amount,
                restoresMana: camp.restores_mana,
                cost: camp.cost ?? undefined,
                discoveryMessage: camp.discovery_message ?? undefined,
              },
            };
            break;
          }
          case "transition": {
            const transition = interactionData.transitions;
            if (!transition) break;
            interaction = {
              type: "transition",
              transition: {
                destination: transition.destination,
                discoveryMessage:
                  transition.discovery_message ?? undefined,
                sanctuaryAvailable:
                  transition.sanctuary_available ?? false,
              },
            };
            break;
          }
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
    finalRooms[index].neighboringRooms = roomObj.neighboringRooms.flatMap(
      ([direction, roomId]) => {
        const neighbor = roomMap.get(roomId);
        if (!neighbor) return [];
        return [[direction, neighbor] as [Directions, Room]];
      },
    );
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
    .select("*")
    .eq("id", enemyId)
    .single();

  if (error) throw error;
  if (!data) return null;

  return mapDbEnemy(data as DbEnemy);
}
