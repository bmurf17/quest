import { tempChar, CharacterData } from "@/types/Character";
import { room, Room } from "@/types/Room";
import { create } from "zustand";

export interface GameState {
  bears: number;
  party: CharacterData[];
  activityLog: string[];
  room: Room;
  increasePopulation: () => void;
  removeAllBears: () => void;
  updateBears: (newBears: number) => void;
  addToLog: (log: string) => void;
}

export const useGameStore = create<GameState>((set) => ({
  bears: 0,
  party: [tempChar, tempChar, tempChar],
  activityLog: ["1 Red Mushrhum draws near for a fight!"],
  room: room,
  addToLog: (message: string) =>
    set((state) => ({
      activityLog: [...state.activityLog, message],
    })),

  increasePopulation: () => set((state) => ({ bears: state.bears + 1 })),
  removeAllBears: () => set({ bears: 0 }),
  updateBears: (newBears) => set({ bears: newBears }),

  attack: () =>
    set((state) => ({
      activityLog: [...state.activityLog, "You attacked"],
    })),
}));
