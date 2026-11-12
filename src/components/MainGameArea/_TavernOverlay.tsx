import { useState } from "react";
import { useGameStore } from "@/state/GameState";
import { CharacterData } from "@/types/Character";
import { colors, fonts } from "@/theme";
import { TavernCharacterCard } from "./tavern/TavernCharacterCard";
import { CharacterDetailDialog } from "./tavern/CharacterDetailDialog";

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
        style={{
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
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: colors.gold,
              fontFamily: fonts.display,
              letterSpacing: "0.08em",
              marginBottom: 4,
            }}
          >
            ═══ The Tavern ═══
          </div>
          <div
            style={{
              fontSize: 12,
              color: colors.textMuted,
              fontFamily: fonts.body,
            }}
          >
            {hasRecruitedFromTavern
              ? "Your new companion awaits — you can recruit again on your next visit."
              : "You spot a few familiar faces looking for adventure..."}
          </div>
        </div>

        {hasRecruitedFromTavern && (
          <div
            style={{
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
            }}
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
          style={{
            display: "flex",
            gap: 20,
            justifyContent: "center",
            flexWrap: "wrap",
          }}
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
          style={{
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
          }}
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
