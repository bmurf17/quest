import { useGameStore } from "@/state/GameState";
import type { CharacterData } from "@/types/Character";
import type { NPC } from "@/types/RoomInteractions";
import { NPCType } from "@/types/RoomInteractions";
import { partyHasAnimalHandling } from "@/state/utils/DialogueUtils";
import { ActionBtn } from "./ActionBtn";
import { SectionLabel } from "./SectionLabel";
import type { CSSProperties } from "react";

export function DialogueActions({
  npc,
  party,
  onOpenShop,
  onOpenQuestDescription,
}: {
  npc: NPC;
  party: CharacterData[];
  onOpenShop: () => void;
  onOpenQuestDescription: () => void;
}) {
  const speak = useGameStore((state) => state.speak);

  return (
    <div style={dialogueActionsStyle}>
      <SectionLabel>Dialogue</SectionLabel>
      {npc.NPCType === NPCType.ANIMAL && !partyHasAnimalHandling(party) ? (
        <ActionBtn disabled variant="muted" fullWidth>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            width={13}
            height={13}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636"
            />
          </svg>
          Requires Animal Handling
        </ActionBtn>
      ) : (
        <ActionBtn onClick={() => speak(npc)} fullWidth>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            width={13}
            height={13}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z"
            />
          </svg>
          {useGameStore.getState().dialogueIndex < npc.dialogue.length - 1
            ? "Continue Dialogue"
            : "Speak"}
        </ActionBtn>
      )}
      {npc.NPCType === NPCType.MERCHANT && (
        <ActionBtn onClick={onOpenShop} variant="success" fullWidth>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            width={13}
            height={13}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
            />
          </svg>
          Open Shop
        </ActionBtn>
      )}
      {npc.NPCType === NPCType.QUEST_GIVER && (
        <ActionBtn onClick={onOpenQuestDescription} variant="success" fullWidth>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            width={13}
            height={13}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
            />
          </svg>
          Check Quest
        </ActionBtn>
      )}
    </div>
  );
}

// Static style objects hoisted out of the render path.
const dialogueActionsStyle: CSSProperties = { display: "flex", flexDirection: "column", gap: 6 };
