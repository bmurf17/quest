import { create } from "zustand";
import { createActivitySlice } from "./slices/activitySlice";
import { createCombatSlice } from "./slices/combatSlice";
import { createDialogueSlice } from "./slices/dialogueSlice";
import { createInventorySlice } from "./slices/inventorySlice";
import { createPartySlice } from "./slices/partySlice";
import { createSaveSlice } from "./slices/saveSlice";
import { createWorldSlice } from "./slices/worldSlice";
import type { GameState } from "./slices/types";

export type { GameState } from "./slices/types";

/**
 * The game store is composed from focused slices (one file per subsystem) so
 * each part stays reviewable. The slices still read and act on the whole
 * `GameState` because game systems are genuinely coupled (combat moves the
 * party, dialogue changes rooms, etc.); what changes is where the code lives,
 * not the public `useGameStore` API.
 */
export const useGameStore = create<GameState>()((...args) => ({
  ...createActivitySlice(...args),
  ...createPartySlice(...args),
  ...createCombatSlice(...args),
  ...createInventorySlice(...args),
  ...createDialogueSlice(...args),
  ...createWorldSlice(...args),
  ...createSaveSlice(...args),
}));
