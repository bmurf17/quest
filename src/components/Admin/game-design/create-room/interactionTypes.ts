export const INTERACTION_TYPES = [
  "NPC",
  "Chest",
  "Camp",
  "Combat",
  "Transition",
  "None",
] as const;

export type InteractionType = (typeof INTERACTION_TYPES)[number];

export const interactionColors: Record<InteractionType, string> = {
  NPC: "#6366F1",
  Chest: "#D97706",
  Camp: "#059669",
  Combat: "#DC2626",
  Transition: "#7C3AED",
  None: "#6B7280",
};
