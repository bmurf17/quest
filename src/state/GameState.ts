import { tempChar, CharacterData } from "@/types/Character";
import { Directions } from "@/types/Directions";
import { Enemy } from "@/types/Enemy";
import { GameStatus } from "@/types/GameStatus";
import { startRoom, Room } from "@/types/Room";
import { create } from "zustand";

export interface GameState {
  party: CharacterData[];
  activityLog: string[];
  room: Room;
  gameStatus: GameStatus;
  addToLog: (log: string) => void;
  attack: (enemy: Enemy) => void;
  move: (direction: Directions) => void;
}

export const useGameStore = create<GameState>((set) => ({
  party: [tempChar, tempChar, tempChar],
  activityLog: ["1 Red Mushrhum draws near for a fight!"],
  room: startRoom,
  gameStatus: GameStatus.Combat,

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

        state.party[0].hp = state.party[0].hp - 2;
        logMessage2 = `${enemy.name} attacked you back!`;
      }

      const updatedRoom = {
        ...state.room,
        enemies: updatedEnemies,
      };

      return {
        activityLog: [...state.activityLog, logMessage],
        room: updatedRoom,
        gameStatus: status,
      };
    }),

  move: (direction: Directions) =>
    set((state) => {
      const newRoom = state.room.neighboringRooms.find(
        ([mapDirection]) => mapDirection === direction
      )?.[1];

      var logMessage = `Your part has moved ${direction}`;

      return {
        activityLog: [...state.activityLog, logMessage],
        room: newRoom || state.room,
      };
    }),
}));
