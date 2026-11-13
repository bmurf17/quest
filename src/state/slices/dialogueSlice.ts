import { getDialogueForNPC, getDialogueNode } from "@/queries/DialogueQueries";
import { getRoomInstanceKey } from "@/state/utils/WorldUtils";
import type { Room } from "@/types/Room";
import type { DialogueNode, DialogueOutcome, NPC } from "@/types/RoomInteractions";
import { DialogueOutcomeType, NPCDisposition } from "@/types/RoomInteractions";
import type { GameState, GameSlice } from "./types";

export type DialogueSlice = Pick<
  GameState,
  | "speak"
  | "dialogueIndex"
  | "advanceDialogue"
  | "activeDialogue"
  | "currentDialogueNodeId"
  | "conversationFlags"
  | "dialogueTrees"
  | "startDialogue"
  | "preloadDialogueTrees"
  | "selectDialogueChoice"
  | "checkSkillCondition"
  | "applyOutcome"
  | "setDisposition"
>;

export const createDialogueSlice: GameSlice<DialogueSlice> = (set, get) => ({
  dialogueIndex: 0,
  activeDialogue: null,
  currentDialogueNodeId: null,
  conversationFlags: {},
  dialogueTrees: new Map<number, DialogueNode>(),

  speak: (npc: NPC) =>
    set((state) => {
      const nextIndex = state.dialogueIndex + 1;
      const currentLine = npc.dialogue[state.dialogueIndex];

      if (currentLine) {
        return {
          dialogueIndex: Math.min(nextIndex, npc.dialogue.length - 1),
          activityLog: [...state.activityLog, `${npc.name}: ${currentLine}`],
        };
      }
      return state;
    }),

  startDialogue: (npc: NPC, node?: DialogueNode) => {
    const tree = node || (npc.id ? get().dialogueTrees.get(npc.id) : null);
    if (!tree) {
      if (npc.id) {
        void getDialogueForNPC(npc.id).then((fetchedTree) => {
          if (fetchedTree) {
            set((state) => {
              const updated = new Map(state.dialogueTrees);
              updated.set(npc.id!, fetchedTree);
              return {
                dialogueTrees: updated,
                activeDialogue: fetchedTree,
                currentDialogueNodeId: fetchedTree.id,
              };
            });
          }
        });
      }
      return;
    }
    set({
      activeDialogue: tree,
      currentDialogueNodeId: tree.id,
      dialogueIndex: 0,
      activityLog: [...get().activityLog, `${npc.name}: ${tree.text}`],
    });
  },

  preloadDialogueTrees: (rooms: Room[]) => {
    rooms.forEach((room) => {
      if (room.interaction?.type === "NPC" && room.interaction.npc.id) {
        const npcId = room.interaction.npc.id;
        const existing = get().dialogueTrees.get(npcId);
        if (!existing) {
          void getDialogueForNPC(npcId).then((tree) => {
            if (tree) {
              set((state) => {
                const updated = new Map(state.dialogueTrees);
                updated.set(npcId, tree);
                return { dialogueTrees: updated };
              });
            }
          });
        }
      }
    });
  },

  selectDialogueChoice: (choiceId: string) => {
    const state = get();
    if (!state.activeDialogue) return;

    const choice = state.activeDialogue.choices?.find((c) => c.id === choiceId);
    if (!choice) return;

    set({
      activityLog: [...state.activityLog, `You: ${choice.text}`],
    });

    let nextNodeId: string | null | undefined;

    if (choice.skillCondition) {
      const passed = state.checkSkillCondition(
        choice.skillCondition.skill,
        choice.skillCondition.dc,
      );
      nextNodeId = passed
        ? choice.skillCondition.successNodeId
        : choice.skillCondition.failureNodeId;
    } else {
      nextNodeId = choice.nextNodeId;
    }

    if (nextNodeId) {
      set({ currentDialogueNodeId: nextNodeId });
      // Load the chosen node so the visible dialogue actually advances. The
      // current id is updated immediately for callers that only inspect state.
      void getDialogueNode(nextNodeId)
        .then((node) => {
          if (!node) return;
          set((current) =>
            current.activeDialogue !== null && current.currentDialogueNodeId === nextNodeId
              ? { activeDialogue: node }
              : {},
          );
        })
        .catch(() => {
          // Leave the current node in place if the follow-up cannot be loaded.
        });
    }

    if (choice.outcome) {
      const roomNpc = state.room.interaction?.type === "NPC" ? state.room.interaction.npc : null;
      if (roomNpc) {
        state.applyOutcome(choice.outcome, roomNpc);
      }
    }
  },

  checkSkillCondition: (skill: string, dc: number): boolean => {
    const state = get();

    for (const char of state.party) {
      const skillObj = char.skills?.find((s) => s.name.toLowerCase() === skill.toLowerCase());
      if (skillObj) {
        const modifier = parseInt(skillObj.modifier);
        const roll = Math.floor(Math.random() * 20) + 1;
        return roll + modifier >= dc;
      }
    }

    const roll = Math.floor(Math.random() * 20) + 1;
    return roll >= dc;
  },

  applyOutcome: (outcome: DialogueOutcome, npc: NPC) => {
    const state = get();
    const npcId = npc.id?.toString() || npc.name;

    switch (outcome.type) {
      case DialogueOutcomeType.NPC_HOSTILE:
        state.setDisposition(npc, NPCDisposition.HOSTILE);
        state.addToLog(`${npc.name} becomes hostile!`);
        break;
      case DialogueOutcomeType.NPC_FRIENDLY: {
        state.setDisposition(npc, NPCDisposition.FRIENDLY);
        state.addToLog(`${npc.name} is now friendly toward you.`);
        const current = get();
        const updatedRoom = { ...current.room };
        const roomInstances = new Map(current.roomInstances);
        const instanceKey = getRoomInstanceKey(current);
        if (instanceKey !== undefined) roomInstances.set(instanceKey, updatedRoom);
        set({
          room: updatedRoom,
          roomInstances,
          activeDialogue: null,
          currentDialogueNodeId: null,
        });
        break;
      }
      case DialogueOutcomeType.NPC_LEAVE: {
        const current = get();
        const updatedRoom = { ...current.room, interaction: null };
        const roomInstances = new Map(current.roomInstances);
        const instanceKey = getRoomInstanceKey(current);
        if (instanceKey !== undefined) roomInstances.set(instanceKey, updatedRoom);
        set({
          room: updatedRoom,
          roomInstances,
          activeDialogue: null,
          currentDialogueNodeId: null,
        });
        state.addToLog(`${npc.name} storms off in anger!`);
        break;
      }
      case DialogueOutcomeType.QUEST_START:
        if (outcome.value) {
          state.addToLog(`Quest started: ${outcome.value}`);
        }
        break;
      case DialogueOutcomeType.ITEM_GIVE:
        if (outcome.value) {
          state.addToLog(`Received: ${outcome.value}`);
        }
        break;
      case DialogueOutcomeType.END_CONVERSATION:
        set({
          activeDialogue: null,
          currentDialogueNodeId: null,
        });
        break;
    }

    if (outcome.flagKey && outcome.flagValue) {
      const flags = { ...state.conversationFlags };
      if (!flags[npcId]) flags[npcId] = {};
      flags[npcId][outcome.flagKey] = outcome.flagValue;
      set({ conversationFlags: flags });
    }
  },

  setDisposition: (npc: NPC, disposition: NPCDisposition) => {
    set((state) => {
      const updatedRoom = { ...state.room };
      if (
        updatedRoom.interaction?.type === "NPC" &&
        updatedRoom.interaction.npc.name === npc.name
      ) {
        updatedRoom.interaction = {
          type: "NPC",
          npc: { ...npc, disposition },
        };
      }

      const roomInstances = new Map(state.roomInstances);
      const instanceKey = getRoomInstanceKey(state);
      if (instanceKey !== undefined) roomInstances.set(instanceKey, updatedRoom);

      return { room: updatedRoom, roomInstances };
    });
  },

  advanceDialogue: () =>
    set((state) => ({
      dialogueIndex: state.dialogueIndex + 1,
    })),
});
