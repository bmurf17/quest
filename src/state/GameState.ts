import { tempRanger, CharacterData, tempWarrior } from "@/types/Character";
import { Directions } from "@/types/Directions";
import { Enemy } from "@/types/Enemy";
import { GameStatus } from "@/types/GameStatus";
import { startRoom, Room, rooms } from "@/types/Room";
import { getDiscoveryMessage } from "@/types/RoomInteractions";
import { create } from "zustand";

export interface GameState {
  party: CharacterData[];
  activityLog: string[];
  room: Room;
  roomInstances: Map<Room, Room>;
  gameStatus: GameStatus;
  rooms: Room[];
  addToLog: (log: string) => void;
  attack: (enemy: Enemy) => void;
  move: (direction: Directions) => void;
  addRoom: (room: Room) => void;
  updateRoom: (room: Room) => void;
}

export const useGameStore = create<GameState>((set) => ({
  party: [tempRanger, tempWarrior],
  activityLog: ["1 Red Mushrhum draws near for a fight!"],
  room: startRoom,
  gameStatus: GameStatus.Combat,
  roomInstances: new Map<Room, Room>([
    [
      startRoom,
      { ...startRoom, enemies: startRoom.enemies.map((e) => ({ ...e })) },
    ],
  ]),
  rooms: rooms,

  addToLog: (message: string) =>
    set((state) => ({
      activityLog: [...state.activityLog, message],
    })),

  attack: (enemy: Enemy) =>
    set((state) => {
      const newHealth = enemy.health - 2;
      let updatedEnemies;
      let logMessage;
      let logMessage2;
      let status = GameStatus.Combat;

      const currentRoomInstance =
        state.roomInstances.get(state.room) || state.room;

      if (newHealth <= 0) {
        updatedEnemies = currentRoomInstance.enemies.filter(
          (e) => e.id !== enemy.id
        );
        logMessage = `${enemy.name} was defeated!`;
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
        logMessage = `You attacked ${enemy.name} for 2 damage! Enemy health: ${newHealth}`;

        const livingMembers = state.party.filter((member) => member.hp > 0);
        if (livingMembers.length > 0) {
          const target =
            livingMembers[Math.floor(Math.random() * livingMembers.length)];
          target.hp -= 2;
          logMessage2 = `${enemy.name} attacked you back! and hit ${target.name}`;
        }
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
      if (logMessage2) {
        newActivityLog.push(logMessage2);
      }

      return {
        room: updatedRoom,
        roomInstances: newRoomInstances,
        gameStatus: status,
        activityLog: newActivityLog,
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

  addRoom: (room: Room) =>
    set((state) => {
      state.rooms.push(room);
      return {
        rooms: rooms,
      };
    }),

  updateRoom: (room: Room) =>
    set((state) => {
      return {
        rooms: state.rooms.map((x) => (x.name !== room.name ? x : room)),
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
