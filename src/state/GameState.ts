import { tempChar, CharacterData } from "@/types/Character";
import { create } from "zustand";

export interface GameState {
  bears: number;
  party: CharacterData[];
  activityLog: string[];
  increasePopulation: () => void;
  removeAllBears: () => void;
  updateBears: (newBears: number) => void;
}

export const useGameStore = create<GameState>((set) => ({
  bears: 0,
  party: [tempChar, tempChar, tempChar],

  activityLog: ["1 Red Mushrhum draws near for a fight!"],

  increasePopulation: () => set((state) => ({ bears: state.bears + 1 })),
  removeAllBears: () => set({ bears: 0 }),
  updateBears: (newBears) => set({ bears: newBears }),
}));
