import { Directions } from "@/types/Directions";
import type { Enemy, EnemyRewardItem } from "@/types/Enemy";
import type { Room, Section } from "@/types/Room";
import type { NPCType, Quest, QuestType, RoomInteraction } from "@/types/RoomInteractions";
import type { EquipmentSlot, Item } from "@/types/Item";
import { supabase } from "@/lib/supabase";
import { resolveEntityImage } from "@/lib/entityImages";
import { unwrapQuery } from "./queryHelpers";
export { supabase };

/** Shape of a row from the `enemies` table. */
export interface DbEnemy {
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
  gold_reward: number;
  reward_items: EnemyRewardItem[] | null;
}

/** Shape of a row from the `items` table. */
export interface DbItem {
  id: string;
  name: string;
  value: number;
  img: string;
  type: "consumable" | "equipment";
  effect: string | null;
  hp_change: number | null;
  mana_change: number | null;
  stack_size: number | null;
  slot: EquipmentSlot | null;
  attack: number | null;
  defense: number | null;
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

export interface DbQuest {
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
  cutscene_id: string | null;
  discovery_message: string | null;
  npcs: DbNpc | null;
  chests: DbChest | null;
  camps: DbCamp | null;
  transitions: DbTransition | null;
}

export const mapDbItem = (it: DbItem | null | undefined): Item | null => {
  if (!it) return null;

  const base = {
    name: it.name,
    value: it.value,
    img: resolveEntityImage(it.img, "items"),
    // `value` is the only price column in the database.
    cost: it.value,
    // The items table has no dedicated description column; `effect` doubles as
    // the shop description for both consumables and equipment.
    description: it.effect ?? undefined,
  };

  if (it.type === "consumable") {
    return {
      ...base,
      type: "consumable",
      effect: it.effect ?? "",
      hpChange: it.hp_change ?? 0,
      manaChange: it.mana_change ?? 0,
      // The items table has no target column; consumables default to single.
      target: "single",
      stackSize: it.stack_size ?? undefined,
    };
  }

  return {
    ...base,
    type: "equipment",
    slot: it.slot as EquipmentSlot,
    stats: {
      attack: it.attack ?? undefined,
      defense: it.defense ?? undefined,
    },
  };
};

export const mapDbEnemy = (e: DbEnemy): Enemy => ({
  id: e.id,
  name: e.name,
  health: e.health,
  maxHealth: e.max_health ?? undefined,
  strength: e.strength,
  dex: e.dex,
  defense: e.defense,
  img: resolveEntityImage(e.img, "enemies"),
  expGain: e.exp_gain ?? 10,
  type: e.type ?? "enemy",
  phase: e.type === "boss" ? 1 : undefined,
  phaseThresholds: Array.isArray(e.phase_thresholds) ? e.phase_thresholds : undefined,
  moves: Array.isArray(e.moves) ? e.moves : undefined,
  spawns: Array.isArray(e.spawns) ? e.spawns : undefined,
  goldReward: e.gold_reward ?? 0,
  rewardItems: Array.isArray(e.reward_items) ? e.reward_items : undefined,
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

export const mapDbQuest = async (q: DbQuest): Promise<Quest> => ({
  id: q.id,
  name: q.name,
  description: q.description,
  type: await mapQuestType(q),
  objectives: q.objectives ? q.objectives.map((o) => o.objective) : [],
  rewards: q.rewards
    ? q.rewards.map((r) => mapDbItem(r.item)).filter((item): item is Item => item !== null)
    : [],
  accepted: false,
  completed: false,
});

export async function getAllRooms(): Promise<Room[]> {
  const rooms = unwrapQuery(await supabase.from("rooms").select("*").order("id"));

  const [enemiesData, neighborsData, interactionsData] = await Promise.all([
    supabase.from("room_enemies").select("room_id, enemies(*)").then(unwrapQuery),

    supabase
      .from("neighboring_rooms")
      .select("room_id, direction, neighbor_room_id")
      .then(unwrapQuery),

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
      .then(unwrapQuery),
  ]);

  const enemiesByRoom = new Map<number, Enemy[]>();
  enemiesData?.forEach((re) => {
    if (!enemiesByRoom.has(re.room_id)) {
      enemiesByRoom.set(re.room_id, []);
    }
    if (re.enemies) {
      enemiesByRoom.get(re.room_id)!.push(mapDbEnemy(re.enemies as unknown as DbEnemy));
    }
  });

  const neighborsByRoom = new Map<number, [Directions, number][]>();
  neighborsData?.forEach((nr) => {
    if (!neighborsByRoom.has(nr.room_id)) {
      neighborsByRoom.set(nr.room_id, []);
    }
    neighborsByRoom
      .get(nr.room_id)!
      .push([nr.direction as unknown as Directions, nr.neighbor_room_id]);
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

            const mappedQuest = npc.quest ? await mapDbQuest(npc.quest) : undefined;

            interaction = {
              type: "NPC",
              npc: {
                id: npc.id,
                name: npc.name,
                dialogue: npc.dialogue,
                discoveryMessage: npc.discovery_message ?? undefined,
                NPCType: npc.npc_type as NPCType,
                img: resolveEntityImage(npc.img, "npc"),
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
                discoveryMessage: transition.discovery_message ?? undefined,
                sanctuaryAvailable: transition.sanctuary_available ?? false,
              },
            };
            break;
          }
          case "cutscene":
            interaction = {
              type: "cutscene",
              cutscene: {
                cutsceneId: interactionData.cutscene_id ?? "intro",
                discoveryMessage: interactionData.discovery_message ?? undefined,
              },
            };
            break;
        }
      }

      const neighbors = neighborsByRoom.get(room.id) || [];
      const neighboringRooms: [Directions, number][] = neighbors.map(([dirStr, roomId]) => {
        const direction = Directions[dirStr as unknown as keyof typeof Directions];
        return [direction, roomId];
      });

      return {
        id: room.id,
        name: room.name,
        sectionId: room.section_id ?? 0,
        enemies: enemiesByRoom.get(room.id) || [],
        neighboringRooms,
        interaction,
        mapX: room.map_x ?? null,
        mapY: room.map_y ?? null,
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
    mapX: roomObj.mapX,
    mapY: roomObj.mapY,
  }));

  roomObjects.forEach((roomObj, index) => {
    roomMap.set(roomObj.id, finalRooms[index]);
  });

  roomObjects.forEach((roomObj, index) => {
    finalRooms[index].neighboringRooms = roomObj.neighboringRooms.flatMap(([direction, roomId]) => {
      const neighbor = roomMap.get(roomId);
      if (!neighbor) return [];
      return [[direction, neighbor] as [Directions, Room]];
    });
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
  // `select *` keeps the app loadable before migration 008 adds start_room_id.
  const data = unwrapQuery(await supabase.from("sections").select("*").order("id"));

  return (data ?? []).map((section) => ({
    id: section.id,
    name: section.name,
    startRoomId: section.start_room_id ?? null,
  }));
}

export async function getRoomsBySection(sectionId: number): Promise<Room[]> {
  const allRooms = await getAllRooms();
  return allRooms.filter((r) => r.sectionId === sectionId);
}

export async function getEnemyById(enemyId: number): Promise<Enemy | null> {
  const data = unwrapQuery(await supabase.from("enemies").select("*").eq("id", enemyId).single());

  if (!data) return null;

  return mapDbEnemy(data as DbEnemy);
}
