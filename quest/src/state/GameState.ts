import { create } from "zustand";
import { Character } from "../types/Character";

export interface GameState {
  bears: number;
  party: Character[];
  activityLog: string[];
  increasePopulation: () => void;
  removeAllBears: () => void;
  updateBears: (newBears: number) => void;
}

export const useGameStore = create<GameState>((set) => ({
  bears: 0,
  party: [
    { name: "Brendan", hp: 80, maxHp: 100, mp: 60, maxMp: 100 },
    { name: "Character 2", hp: 90, maxHp: 100, mp: 75, maxMp: 100 },
    { name: "Character 3", hp: 70, maxHp: 100, mp: 85, maxMp: 100 },
  ],

  activityLog: ["1 Red Mushrhum draws near for a fight!"],

  increasePopulation: () => set((state) => ({ bears: state.bears + 1 })),
  removeAllBears: () => set({ bears: 0 }),
  updateBears: (newBears) => set({ bears: newBears }),
}));
