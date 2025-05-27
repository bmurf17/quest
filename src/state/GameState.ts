import { tempRanger, CharacterData, tempWarrior } from "@/types/Character";
import { Directions } from "@/types/Directions";
import { Enemy } from "@/types/Enemy";
import { GameStatus } from "@/types/GameStatus";
import { startRoom, Room } from "@/types/Room";
import { create } from "zustand";

export interface GameState {
  party: CharacterData[];
  activityLog: string[];
  room: Room;
  roomInstances: Map<Room, Room>;
  gameStatus: GameStatus;
  addToLog: (log: string) => void;
  attack: (enemy: Enemy) => void;
  move: (direction: Directions) => void;
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

  addToLog: (message: string) =>
    set((state) => ({
      activityLog: [...state.activityLog, message],
    })),

  attack: (enemy: Enemy) =>
    set((state) => {
      const newHealth = enemy.health - 2;
      var updatedEnemies;
      var logMessage;
      var logMessage2;
      var status = GameStatus.Combat;

      if (newHealth <= 0) {
        updatedEnemies = state.room.enemies.filter((e) => e.id !== enemy.id);
        logMessage = `${enemy.name} was defeated!`;
        status = GameStatus.Exploring;
      } else {
        updatedEnemies = state.room.enemies.map((e) => {
          if (e.id === enemy.id) {
            return {
              ...e,
              health: newHealth,
            };
          }
          return e;
        });
        logMessage = `You attacked ${enemy.name} for 2 damage! Enemy health: ${newHealth}`;

        var livingMembers = state.party.filter((member) => member.hp > 0);
        if (livingMembers.length > 0) {
          var target =
            livingMembers[Math.floor(Math.random() * livingMembers.length)];
          target.hp -= 2;

          logMessage2 = `${enemy.name} attacked you back! and hit ${target.name}`;
        }
      }

      const updatedRoom = {
        ...state.room,
        enemies: updatedEnemies,
      };

      // Find the original room template and update its instance
      const originalTemplate = [...state.roomInstances.entries()].find(
        ([, instance]) => instance === state.room
      )?.[0];

      if (originalTemplate) {
        const newRoomInstances = new Map(state.roomInstances);
        newRoomInstances.set(originalTemplate, updatedRoom);

        state.addToLog(logMessage);
        if (logMessage2) {
          state.addToLog(logMessage2);
        }

        return {
          room: updatedRoom,
          roomInstances: newRoomInstances,
          gameStatus: status,
        };
      }

      // Fallback if we can't find the template
      state.addToLog(logMessage);
      if (logMessage2) {
        state.addToLog(logMessage2);
      }

      return {
        room: updatedRoom,
        gameStatus: status,
      };
    }),

  move: (direction: Directions) =>
    set((state) => {
      const targetRoomTemplate = state.room.neighboringRooms.find(
        ([mapDirection]) => mapDirection === direction
      )?.[1];

      if (!targetRoomTemplate) {
        return state; // No room in that direction
      }

      // Get or create the room instance
      let roomInstance = state.roomInstances.get(targetRoomTemplate);
      if (!roomInstance) {
        // First time visiting this room - create a copy
        roomInstance = {
          ...targetRoomTemplate,
          enemies: targetRoomTemplate.enemies.map((enemy) => ({ ...enemy })),
        };
      }

      const logMessage = `Your party has moved ${Directions[direction]}`;
      const status =
        roomInstance.enemies.length > 0
          ? GameStatus.Combat
          : GameStatus.Exploring;

      const newRoomInstances = new Map(state.roomInstances);
      newRoomInstances.set(targetRoomTemplate, roomInstance);

      return {
        activityLog: [...state.activityLog, logMessage],
        room: roomInstance,
        roomInstances: newRoomInstances,
        gameStatus: status,
      };
    }),
}));
