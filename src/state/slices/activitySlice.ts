import type { GameState, GameSlice } from "./types";

export type ActivitySlice = Pick<GameState, "activityLog" | "addToLog">;

export const createActivitySlice: GameSlice<ActivitySlice> = (set) => ({
  activityLog: ["You start your adventure."],

  addToLog: (message: string) =>
    set((state) => ({
      activityLog: [...state.activityLog, message],
    })),
});
