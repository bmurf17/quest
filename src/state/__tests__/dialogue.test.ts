import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { tempWarrior } from "@/types/Character";
import type { DialogueNode, NPC } from "@/types/RoomInteractions";
import {
  DialogueOutcomeType,
  NPCDisposition,
  NPCType,
} from "@/types/RoomInteractions";
import type { Room } from "@/types/Room";
import { useGameStore } from "../GameState";

vi.mock("@/lib/supabase", () => ({
  supabase: {},
  default: {},
}));

const initialState = useGameStore.getState();

function npc(overrides: Partial<NPC> = {}): NPC {
  return {
    id: 7,
    name: "Elder",
    dialogue: ["Greetings."],
    NPCType: NPCType.GENERIC,
    img: "",
    ...overrides,
  };
}

function roomWithNpc(npcData: NPC): Room {
  return {
    id: 1,
    name: "Village",
    sectionId: 0,
    enemies: [],
    neighboringRooms: [],
    interaction: { type: "NPC", npc: npcData },
  };
}

function dialogueNode(overrides: Partial<DialogueNode> = {}): DialogueNode {
  return {
    id: "start",
    text: "What do you want?",
    speaker: "NPC",
    isEndpoint: false,
    ...overrides,
  };
}

function seedDialogue(npcData: NPC, node: DialogueNode) {
  useGameStore.setState({
    party: [tempWarrior],
    room: roomWithNpc(npcData),
    activeDialogue: node,
    currentDialogueNodeId: node.id,
    conversationFlags: {},
    activityLog: [],
  });
}

beforeEach(() => {
  useGameStore.setState(initialState, true);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("dialogue outcomes", () => {
  it("makes an NPC hostile and records the outcome flag", () => {
    const elder = npc();
    seedDialogue(elder, dialogueNode());

    useGameStore.getState().applyOutcome(
      {
        type: DialogueOutcomeType.NPC_HOSTILE,
        flagKey: "metElder",
        flagValue: "hostile",
      },
      elder,
    );

    const state = useGameStore.getState();
    const interaction = state.room.interaction;
    expect(interaction?.type).toBe("NPC");
    if (interaction?.type === "NPC") {
      expect(interaction.npc.disposition).toBe(NPCDisposition.HOSTILE);
    }
    expect(state.conversationFlags["7"]).toEqual({ metElder: "hostile" });
    expect(state.activityLog).toContain("Elder becomes hostile!");
  });

  it("closes the conversation when the NPC leaves", () => {
    const elder = npc();
    seedDialogue(elder, dialogueNode());

    useGameStore.getState().applyOutcome(
      { type: DialogueOutcomeType.NPC_LEAVE },
      elder,
    );

    const state = useGameStore.getState();
    expect(state.room.interaction).toBeNull();
    expect(state.activeDialogue).toBeNull();
    expect(state.currentDialogueNodeId).toBeNull();
    expect(state.activityLog).toContain("Elder storms off in anger!");
  });

  it("clears the active node when the conversation ends", () => {
    const elder = npc();
    seedDialogue(elder, dialogueNode());

    useGameStore.getState().applyOutcome(
      { type: DialogueOutcomeType.END_CONVERSATION },
      elder,
    );

    const state = useGameStore.getState();
    expect(state.activeDialogue).toBeNull();
    expect(state.currentDialogueNodeId).toBeNull();
  });
});

describe("dialogue choices", () => {
  it("follows the choice node and applies its outcome", () => {
    const elder = npc();
    seedDialogue(
      elder,
      dialogueNode({
        choices: [
          {
            id: "threaten",
            text: "Leave, or else.",
            nextNodeId: "threatened",
            outcome: {
              type: DialogueOutcomeType.NPC_HOSTILE,
              flagKey: "threatened",
              flagValue: "yes",
            },
          },
        ],
      }),
    );

    useGameStore.getState().selectDialogueChoice("threaten");

    const state = useGameStore.getState();
    expect(state.currentDialogueNodeId).toBe("threatened");
    expect(state.activityLog).toContain("You: Leave, or else.");
    expect(state.conversationFlags["7"]).toEqual({ threatened: "yes" });
  });

  it("uses the failure node when a skill check does not meet the DC", () => {
    const elder = npc();
    seedDialogue(
      elder,
      dialogueNode({
        choices: [
          {
            id: "climb",
            text: "Climb the wall.",
            nextNodeId: null,
            skillCondition: {
              skill: "Athletics",
              dc: 12,
              successNodeId: "success",
              failureNodeId: "failure",
            },
          },
        ],
      }),
    );

    // Roll 1 + Athletics modifier 2 = 3, below the DC of 12.
    vi.spyOn(Math, "random").mockReturnValue(0);
    useGameStore.getState().selectDialogueChoice("climb");

    expect(useGameStore.getState().currentDialogueNodeId).toBe("failure");
  });

  it("uses the success node when a skill check meets the DC", () => {
    const elder = npc();
    seedDialogue(
      elder,
      dialogueNode({
        choices: [
          {
            id: "climb",
            text: "Climb the wall.",
            nextNodeId: null,
            skillCondition: {
              skill: "Athletics",
              dc: 12,
              successNodeId: "success",
              failureNodeId: "failure",
            },
          },
        ],
      }),
    );

    // Roll 20 + Athletics modifier 2 = 22, above the DC of 12.
    vi.spyOn(Math, "random").mockReturnValue(0.99);
    useGameStore.getState().selectDialogueChoice("climb");

    expect(useGameStore.getState().currentDialogueNodeId).toBe("success");
  });

  it("ignores choices that are not part of the active node", () => {
    const elder = npc();
    seedDialogue(elder, dialogueNode());

    useGameStore.getState().selectDialogueChoice("missing");

    expect(useGameStore.getState().currentDialogueNodeId).toBe("start");
  });
});

describe("startDialogue", () => {
  it("uses a provided node without fetching from the database", () => {
    const elder = npc();
    useGameStore.setState({
      activityLog: [],
      dialogueTrees: new Map(),
      room: roomWithNpc(elder),
    });
    const node = dialogueNode({ id: "provided", text: "Provided line" });

    useGameStore.getState().startDialogue(elder, node);

    const state = useGameStore.getState();
    expect(state.activeDialogue).toBe(node);
    expect(state.currentDialogueNodeId).toBe("provided");
    expect(state.activityLog).toContain("Elder: Provided line");
  });
});
