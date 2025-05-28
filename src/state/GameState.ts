import { tempRanger, CharacterData, tempWarrior } from "@/types/Character";
import { Directions } from "@/types/Directions";
import { Enemy } from "@/types/Enemy";
import { GameStatus } from "@/types/GameStatus";
import { startRoom, Room } from "@/types/Room";
import { create } from "zustand";
import { persist } from "zustand/middleware";

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
      let updatedEnemies;
      let logMessage;
      let logMessage2;
      let status = GameStatus.Combat;

      // Get the current room instance
      const currentRoomInstance =
        state.roomInstances.get(state.room) || state.room;

      if (newHealth <= 0) {
        // Remove the defeated enemy
        updatedEnemies = currentRoomInstance.enemies.filter(
          (e) => e.id !== enemy.id
        );
        logMessage = `${enemy.name} was defeated!`;
        // Only change to exploring if no enemies left
        status =
          updatedEnemies.length === 0
            ? GameStatus.Exploring
            : GameStatus.Combat;
      } else {
        // Update the enemy's health
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

        // Enemy counter-attack
        const livingMembers = state.party.filter((member) => member.hp > 0);
        if (livingMembers.length > 0) {
          const target =
            livingMembers[Math.floor(Math.random() * livingMembers.length)];
          target.hp -= 2;
          logMessage2 = `${enemy.name} attacked you back! and hit ${target.name}`;
        }
      }

      // Create the updated room
      const updatedRoom = {
        ...currentRoomInstance,
        enemies: updatedEnemies,
      };

      // Find the original room template
      const originalTemplate = [...state.roomInstances.entries()].find(
        ([template, instance]) =>
          instance === currentRoomInstance || template === state.room
      )?.[0];

      // Update the room instances map
      const newRoomInstances = new Map(state.roomInstances);
      if (originalTemplate) {
        newRoomInstances.set(originalTemplate, updatedRoom);
      }

      // Add messages to log
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
