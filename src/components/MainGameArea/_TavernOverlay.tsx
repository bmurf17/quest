import { useState } from "react";
import { useGameStore } from "@/state/GameState";
import type { CharacterData } from "@/types/Character";
import { colors, fonts } from "@/theme";
import { TavernCharacterCard } from "./tavern/TavernCharacterCard";
import { CharacterDetailDialog } from "./tavern/CharacterDetailDialog";
import type { CSSProperties } from "react";

export default function TavernOverlay() {
  const tavernCandidates = useGameStore((state) => state.tavernCandidates);
  const closeTavern = useGameStore((state) => state.closeTavern);
  const addTavernCharacterToParty = useGameStore(
    (state) => state.addTavernCharacterToParty,
  );
  const party = useGameStore((state) => state.party);
  const hasRecruitedFromTavern = useGameStore(
    (state) => state.hasRecruitedFromTavern,
  );
  const isTavernOpen = useGameStore((state) => state.isTavernOpen);

  const [selectedCharacter, setSelectedCharacter] =
    useState<CharacterData | null>(null);

  const isInParty = (char: CharacterData) =>
    party.some((m) => m.name === char.name);

  return isTavernOpen ? (
    <>
      <div
        style={tavernOverlayStyle}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={tavernOverlayStyle2}
          >
            ═══ The Tavern ═══
          </div>
          <div
            style={tavernOverlayStyle3}
          >
            {hasRecruitedFromTavern
              ? "Your new companion awaits — you can recruit again on your next visit."
              : "You spot a few familiar faces looking for adventure..."}
          </div>
        </div>

        {hasRecruitedFromTavern && (
          <div
            style={tavernOverlayStyle4}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              width={14}
              height={14}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
              />
            </svg>
            Recruited for this visit
          </div>
        )}

        <div
          style={tavernOverlayStyle5}
        >
          {tavernCandidates.map((character, i) => (
            <TavernCharacterCard
              key={character.name + i}
              character={character}
              onView={setSelectedCharacter}
            />
          ))}
        </div>

        <button
          onClick={closeTavern}
          style={tavernOverlayStyle6}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.08)";
            e.currentTarget.style.borderColor = colors.goldBorder;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.04)";
            e.currentTarget.style.borderColor = colors.subtleBorder;
          }}
        >
          Leave Tavern
        </button>
      </div>

      {selectedCharacter && (
        <CharacterDetailDialog
          character={selectedCharacter}
          isOpen={!!selectedCharacter}
          onOpenChange={(open) => {
            if (!open) setSelectedCharacter(null);
          }}
          onAddToParty={(char) => {
            addTavernCharacterToParty(char);
          }}
          alreadyInParty={isInParty(selectedCharacter)}
          hasRecruited={hasRecruitedFromTavern}
        />
      )}
    </>
  ) : (
    <></>
  );
}

// Static style objects hoisted out of the render path.
const tavernOverlayStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 16,
  padding: 20,
  background: "rgba(0,0,0,0.7)",
  border: `1px solid ${colors.goldBorder}`,
  borderRadius: 12,
  backdropFilter: "blur(4px)",
  minWidth: 640,
};
const tavernOverlayStyle2: CSSProperties = {
  fontSize: 24,
  fontWeight: 700,
  color: colors.gold,
  fontFamily: fonts.display,
  letterSpacing: "0.08em",
  marginBottom: 4,
};
const tavernOverlayStyle3: CSSProperties = {
  fontSize: 12,
  color: colors.textMuted,
  fontFamily: fonts.body,
};
const tavernOverlayStyle4: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "8px 16px",
  background: "rgba(52,211,153,0.08)",
  border: "1px solid rgba(52,211,153,0.2)",
  borderRadius: 6,
  fontSize: 12,
  color: colors.success,
  fontFamily: fonts.display,
  letterSpacing: "0.04em",
};
const tavernOverlayStyle5: CSSProperties = {
  display: "flex",
  gap: 20,
  justifyContent: "center",
  flexWrap: "wrap",
};
const tavernOverlayStyle6: CSSProperties = {
  padding: "10px 32px",
  background: "rgba(255,255,255,0.04)",
  border: `1px solid ${colors.subtleBorder}`,
  borderRadius: 6,
  color: colors.textMuted,
  fontSize: 12,
  fontFamily: fonts.display,
  fontWeight: 600,
  cursor: "pointer",
  letterSpacing: "0.06em",
  transition: "background 0.12s, border-color 0.12s",
};
