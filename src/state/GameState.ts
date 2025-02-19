import { tempChar, CharacterData } from "@/types/Character";
import { Enemy } from "@/types/Enemy";
import { room, Room } from "@/types/Room";
import { create } from "zustand";

export interface GameState {
  party: CharacterData[];
  activityLog: string[];
  room: Room;
  addToLog: (log: string) => void;
  attack: (enemy: Enemy) => void;
}

export const useGameStore = create<GameState>((set) => ({
  party: [tempChar, tempChar, tempChar],
  activityLog: ["1 Red Mushrhum draws near for a fight!"],
  room: room,

  addToLog: (message: string) =>
    set((state) => ({
      activityLog: [...state.activityLog, message],
    })),

  attack: (enemy: Enemy) =>
    set((state) => {
      const newHealth = enemy.health - 2;
      let updatedEnemies;
      let logMessage;

      if (newHealth <= 0) {
        // Remove the defeated enemy from the array
        updatedEnemies = state.room.enemies.filter((e) => e.id !== enemy.id);
        logMessage = `${enemy.name} was defeated!`;
      } else {
        // Update the enemy's health
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
      }

      // Create updated room with new enemies array
      const updatedRoom = {
        ...state.room,
        enemies: updatedEnemies,
      };

      return {
        activityLog: [...state.activityLog, logMessage],
        room: updatedRoom,
      };
    }),
}));
