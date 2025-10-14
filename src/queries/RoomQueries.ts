import { Directions } from '@/types/Directions';
import { Enemy } from '@/types/Enemy';
import { Room } from '@/types/Room';
import { RoomInteraction } from '@/types/RoomInteractions';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ojbcuhpmphtriewcccdm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qYmN1aHBtcGh0cmlld2NjY2RtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0MTYyMDgsImV4cCI6MjA3NTk5MjIwOH0.bLXsgDp0UDJ485qZMCQ8BqVjJbBj_qRz-GM8H2GtRqI';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function getAllRooms(): Promise<Room[]> {
  const { data: rooms, error: roomsError } = await supabase
    .from('rooms')
    .select('*')
    .order('id');

  if (roomsError) throw roomsError;

  const [enemiesData, neighborsData, interactionsData] = await Promise.all([
    supabase
      .from('room_enemies')
      .select('room_id, enemies(*)')
      .then(({ data, error }) => {
        if (error) throw error;
        return data;
      }),
    
    supabase
      .from('neighboring_rooms')
      .select('room_id, direction, neighbor_room_id')
      .then(({ data, error }) => {
        if (error) throw error;
        return data;
      }),
    
    supabase
      .from('room_interactions')
      .select(`
        room_id,
        interaction_type,
        npcs(*),
        chests(*),
        camps(*)
      `)
      .then(({ data, error }) => {
        if (error) throw error;
        return data;
      })
  ]);

  const enemiesByRoom = new Map<number, Enemy[]>();
  enemiesData?.forEach(re => {
    if (!enemiesByRoom.has(re.room_id)) {
      enemiesByRoom.set(re.room_id, []);
    }
    if (re.enemies) {
      enemiesByRoom.get(re.room_id)!.push(re.enemies as unknown as Enemy);
    }
  });

  const neighborsByRoom = new Map<number, [Directions, number][]>();
  neighborsData?.forEach(nr => {
    if (!neighborsByRoom.has(nr.room_id)) {
      neighborsByRoom.set(nr.room_id, []);
    }
    neighborsByRoom.get(nr.room_id)!.push([
      nr.direction as Directions,
      nr.neighbor_room_id
    ]);
  });

  const interactionsByRoom = new Map<number, any>();
  interactionsData?.forEach(ri => {
    interactionsByRoom.set(ri.room_id, ri);
  });

  type RoomWithNeighborIds = Omit<Room, 'neighboringRooms'> & {
    id: number;
    neighboringRooms: [Directions, number][];
  };

  const roomObjects: RoomWithNeighborIds[] = rooms!.map(room => {
  let interaction: RoomInteraction | null = null;
  const interactionData = interactionsByRoom.get(room.id);

  if (interactionData) {
    switch (interactionData.interaction_type) {
      case 'NPC':
        interaction = {
          type: 'NPC',
          npc: {
            name: interactionData.npcs.name,
            dialogue: interactionData.npcs.dialogue,
            questId: interactionData.npcs.quest_id,
            discoveryMessage: interactionData.npcs.discovery_message
          }
        };
        break;
      case 'chest':
        interaction = {
          type: 'chest',
          chest: {
            id: interactionData.chests.id,
            itemId: interactionData.chests.item_id,
            quantity: interactionData.chests.quantity,
            isLocked: interactionData.chests.is_locked,
            isOpen: interactionData.chests.is_open,
            discoveryMessage: interactionData.chests.discovery_message
          }
        };
        break;
      case 'camp':
        interaction = {
          type: 'camp',
          camp: {
            healAmount: interactionData.camps.heal_amount,
            restoresMana: interactionData.camps.restores_mana,
            cost: interactionData.camps.cost,
            discoveryMessage: interactionData.camps.discovery_message
          }
        };
        break;
    }
  }

  // Convert string directions to enum values
  const neighbors = neighborsByRoom.get(room.id) || [];
  const neighboringRooms: [Directions, number][] = neighbors.map(([dirStr, roomId]) => {
    const direction = Directions[dirStr as unknown as keyof typeof Directions];
    return [direction, roomId];
  });

  return {
    id: room.id,
    name: room.name,
    enemies: enemiesByRoom.get(room.id) || [],
    neighboringRooms,
    interaction
  };
});
  const roomMap = new Map<number, Room>();
  
  const finalRooms: Room[] = roomObjects.map(roomObj => ({
    name: roomObj.name,
    enemies: roomObj.enemies,
    neighboringRooms: [] as [Directions, Room][], 
    interaction: roomObj.interaction,
    id: roomObj.id
  }));
  
  roomObjects.forEach((roomObj, index) => {
    roomMap.set(roomObj.id, finalRooms[index]);
  });
  
  roomObjects.forEach((roomObj, index) => {
    finalRooms[index].neighboringRooms = roomObj.neighboringRooms.map(([direction, roomId]) => [
      direction,
      roomMap.get(roomId)!
    ]) as [Directions, Room][];
  });

  return finalRooms;
}

export async function getRoomById(roomId: number): Promise<Room | null> {
  const rooms = await getAllRooms();
  return rooms.find(r => r.id === roomId) || null;
}

export async function getRoomByName(name: string): Promise<Room | null> {
  const rooms = await getAllRooms();
  return rooms.find(r => r.name === name) || null;
}