import { CharacterData } from "@/types/Character";
import { Directions } from "@/types/Directions";
import { Enemy } from "@/types/Enemy";
import { GameStatus } from "@/types/GameStatus";
import { Room, startRoom } from "@/types/Room";
import { Chest, getDiscoveryMessage, NPC } from "@/types/RoomInteractions";
import { create } from "zustand";

export interface GameState {
  party: CharacterData[];
  activityLog: string[];
  room: Room;
  roomInstances: Map<Room, Room>;
  gameStatus: GameStatus;
  rooms: Room[];
  combatOrder: (CharacterData | Enemy)[];
  activeFighterIndex: number;
  addToLog: (log: string) => void;
  attack: (enemy: Enemy) => void;
  move: (direction: Directions) => void;
  speak: (npc: NPC) => void;
  setRooms: (rooms: Room[]) => void;
  addRoom: (room: Room) => void;
  updateRoom: (room: Room) => void;
  setParty: (characters: CharacterData[]) => void;
  updateChest: (chest: Chest) => void;
  enterCombat: () => void;
  isCurrentFighterEnemy: () => boolean;
  performEnemyTurn: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  party: [],
  activityLog: ["1 Red Mushrhum draws near for a fight!"],
  room: startRoom,
  gameStatus: GameStatus.Combat,
  roomInstances: new Map<Room, Room>([
    [
      startRoom,
      { ...startRoom, enemies: startRoom.enemies.map((e) => ({ ...e })) },
    ],
  ]),
  rooms: [],
  combatOrder: [],
  activeFighterIndex: 0,

  addToLog: (message: string) =>
    set((state) => ({
      activityLog: [...state.activityLog, message],
    })),

  isCurrentFighterEnemy: () => {
    const state = get();
    const currentFighter = state.combatOrder[state.activeFighterIndex];
    return (
      currentFighter && "health" in currentFighter && "id" in currentFighter
    );
  },

  // Separate method for enemy AI turn
  performEnemyTurn: () => {
    const state = get();
    const currentEnemy = state.combatOrder[state.activeFighterIndex] as Enemy;

    if (!currentEnemy) return;

    // Pick a random living party member to attack
    const livingMembers = state.party.filter((member) => member.hp > 0);
    if (livingMembers.length === 0) return;

    const target =
      livingMembers[Math.floor(Math.random() * livingMembers.length)];

    set((state) => {
      const updatedParty = state.party.map((member) => {
        if (member.name === target.name) {
          return { ...member, hp: Math.max(0, member.hp - 2) };
        }
        return member;
      });

      const logMessage = `${currentEnemy.name} attacked ${
        target.name
      } for 2 damage! ${target.name}'s HP: ${Math.max(0, target.hp - 2)}`;

      // Advance to next fighter
      const nextIndex =
        (state.activeFighterIndex + 1) % state.combatOrder.length;

      return {
        party: updatedParty,
        activityLog: [...state.activityLog, logMessage],
        activeFighterIndex: nextIndex,
      };
    });

    // Check if next fighter is also an enemy, continue the chain
    setTimeout(() => {
      const { isCurrentFighterEnemy, performEnemyTurn } = get();
      if (isCurrentFighterEnemy()) {
        performEnemyTurn();
      }
    }, 500);
  },

  attack: (enemy: Enemy) => {
    set((state) => {
      // Get the current attacker from combat order
      const currentAttacker = state.combatOrder[state.activeFighterIndex];
      const attackerName = currentAttacker?.name || "Unknown";

      const newHealth = enemy.health - 2;
      let updatedEnemies;
      let logMessage;
      let status = GameStatus.Combat;
      const currentRoomInstance =
        state.roomInstances.get(state.room) || state.room;

      if (newHealth <= 0) {
        updatedEnemies = currentRoomInstance.enemies.filter(
          (e) => e.id !== enemy.id
        );
        logMessage = `${attackerName} defeated ${enemy.name}!`;
        status =
          updatedEnemies.length === 0
            ? GameStatus.Exploring
            : GameStatus.Combat;
      } else {
        updatedEnemies = currentRoomInstance.enemies.map((e) => {
          if (e.id === enemy.id) {
            return {
              ...e,
              health: newHealth,
            };
          }
          return e;
        });
        logMessage = `${attackerName} attacked ${enemy.name} for 2 damage! Enemy health: ${newHealth}`;
      }

      const updatedRoom = {
        ...currentRoomInstance,
        enemies: updatedEnemies,
      };

      const originalTemplate = [...state.roomInstances.entries()].find(
        ([template, instance]) =>
          instance === currentRoomInstance || template === state.room
      )?.[0];

      const newRoomInstances = new Map(state.roomInstances);
      if (originalTemplate) {
        newRoomInstances.set(originalTemplate, updatedRoom);
      }

      const newActivityLog = [...state.activityLog, logMessage];

      // Advance to next fighter in combat order with wrapping
      const nextIndex =
        (state.activeFighterIndex + 1) % state.combatOrder.length;

      return {
        room: updatedRoom,
        roomInstances: newRoomInstances,
        gameStatus: status,
        activityLog: newActivityLog,
        activeFighterIndex: nextIndex,
      };
    });

    // Trigger enemy turn if next fighter is an enemy
    setTimeout(() => {
      const { gameStatus, isCurrentFighterEnemy, performEnemyTurn } = get();
      if (gameStatus === GameStatus.Combat && isCurrentFighterEnemy()) {
        performEnemyTurn();
      }
    }, 500);
  },

  speak: (npc: NPC) =>
    set((state) => {
      const logBuilder = new ActivityLogBuilder().add(
        `${npc.name} says: ${npc.dialogue}`
      );

      return {
        activityLog: [...state.activityLog, ...logBuilder.build()],
      };
    }),

  move: (direction: Directions) =>
    set((state) => {
      const targetRoomTemplate = state.room.neighboringRooms.find(
        ([mapDirection]) => mapDirection === direction
      )?.[1];

      if (!targetRoomTemplate) {
        return state;
      }

      let roomInstance = state.roomInstances.get(targetRoomTemplate);
      if (!roomInstance) {
        roomInstance = {
          ...targetRoomTemplate,
          enemies: targetRoomTemplate.enemies.map((enemy) => ({ ...enemy })),
        };
      }

      const status =
        roomInstance.enemies.length > 0
          ? GameStatus.Combat
          : GameStatus.Exploring;

      // Build activity log messages
      const logBuilder = new ActivityLogBuilder()
        .add(`Your party has moved ${Directions[direction]}`)
        .addIf(
          status === GameStatus.Exploring && !!roomInstance.interaction,
          roomInstance.interaction
            ? getDiscoveryMessage(roomInstance.interaction)
            : ""
        )
        .addIf(
          roomInstance.enemies.length > 0,
          `You encounter ${roomInstance.enemies.length} ${
            roomInstance.enemies.length === 1 ? "enemy" : "enemies"
          }!`
        );

      const newRoomInstances = new Map(state.roomInstances);
      newRoomInstances.set(targetRoomTemplate, roomInstance);

      return {
        activityLog: [...state.activityLog, ...logBuilder.build()],
        room: roomInstance,
        roomInstances: newRoomInstances,
        gameStatus: status,
      };
    }),

  setRooms: (rooms: Room[]) =>
    set(() => ({
      room: rooms[0],
      rooms: rooms,
    })),

  addRoom: (room: Room) =>
    set((state) => ({
      rooms: [...state.rooms, room],
    })),

  updateRoom: (room: Room) =>
    set((state) => {
      return {
        rooms: state.rooms.map((x) => (x.name !== room.name ? x : room)),
      };
    }),

  setParty: (chars: CharacterData[]) =>
    set(() => {
      return {
        party: chars,
      };
    }),

  updateChest: (chest: Chest) =>
    set((state) => {
      const currentRoomInstance =
        state.roomInstances.get(state.room) || state.room;
      const logBuilder = new ActivityLogBuilder().add(
        `You have opened the chest!`
      );
      const updatedRoom: Room = {
        ...currentRoomInstance,
        interaction: { type: "chest", chest: chest },
      };

      const originalTemplate = [...state.roomInstances.entries()].find(
        ([template, instance]) =>
          instance === currentRoomInstance || template === state.room
      )?.[0];

      const newRoomInstances = new Map(state.roomInstances);
      if (originalTemplate) {
        newRoomInstances.set(originalTemplate, updatedRoom);
      }

      return {
        activityLog: [...state.activityLog, ...logBuilder.build()],
        room: updatedRoom,
        roomInstances: newRoomInstances,
      };
    }),

  enterCombat: () =>
    set((state) => {
      const theParty = state.party;
      const room =
        state.room !== null && state.room !== undefined
          ? state.room
          : startRoom;

      const theEnemies = room.enemies;

      const combatOrder = [...theParty, ...theEnemies];

      return {
        combatOrder: combatOrder,
      };
    }),
}));

class ActivityLogBuilder {
  private messages: string[] = [];

  add(message: string): this {
    this.messages.push(message);
    return this;
  }

  addIf(condition: boolean, message: string): this {
    if (condition) {
      this.messages.push(message);
    }
    return this;
  }

  build(): string[] {
    return [...this.messages];
  }
}
