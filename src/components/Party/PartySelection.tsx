import type { CharacterData } from "@/types/Character";
import { colors, fonts } from "@/theme";
import { StatBar } from "@/components/shared/StatBar";
import { CharacterDetailPanel } from "./shared/CharacterDetailPanel";
import { PartyRosterPanel } from "./shared/PartyRosterPanel";
import { usePartySelection } from "./shared/usePartySelection";
import type { CSSProperties } from "react";

interface PartyPickerProps {
  availableCharacters: CharacterData[];
}

export function PartySelection({ availableCharacters }: PartyPickerProps) {
  const {
    selectedCharacter,
    setSelectedCharacter,
    party,
    isInParty,
    isPartyFull,
    handleAddToParty,
    handleRemove,
  } = usePartySelection(availableCharacters);

  return (
    <>
      <div style={partySelectionStyle}>
        <div style={partySelectionStyle2}>
          <div
            style={{
              padding: "20px 18px 14px",
              borderBottom: "1px solid rgba(180,140,80,0.1)",
            }}
          >
            <h2 style={partySelectionStyle3}>Choose Class</h2>
          </div>
          <div className="scrollbar-thin" style={partySelectionStyle4}>
            {availableCharacters.map((character, i) => {
              const active = selectedCharacter?.class === character.class;
              const inParty = party.some((m) => m.class === character.class);
              return (
                <button
                  type="button"
                  key={i}
                  className="char-row"
                  onClick={() => setSelectedCharacter(character)}
                  aria-pressed={active}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 11px",
                    borderRadius: 7,
                    border: `1px solid ${active ? "rgba(212,175,55,0.4)" : "transparent"}`,
                    background: active ? "rgba(212,175,55,0.09)" : "transparent",
                    cursor: "pointer",
                    transition: "background 0.12s, border-color 0.12s",
                    font: "inherit",
                    textAlign: "left",
                    width: "100%",
                  }}
                >
                  <div style={partySelectionStyle5}>
                    <img src={character.img} alt={character.name} style={partySelectionStyle6} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: active ? colors.text : colors.textMuted,
                        fontFamily: fonts.display,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        marginBottom: 6,
                      }}
                    >
                      {character.name}
                    </div>
                    <StatBar value={character.hp} max={character.maxHp} color={colors.danger} />
                    <div style={{ marginTop: 4 }}>
                      <StatBar value={character.mp} max={character.maxMp} color="#6366F1" />
                    </div>
                  </div>
                  {inParty && <div style={partySelectionStyle7} />}
                </button>
              );
            })}
          </div>
        </div>

        <CharacterDetailPanel
          character={selectedCharacter}
          showAbilityModifiers
          emptyMessage="Select a class to preview"
          footer={
            <button
              onClick={handleAddToParty}
              disabled={isPartyFull || isInParty}
              style={{
                width: "100%",
                padding: "15px",
                borderRadius: 8,
                fontFamily: fonts.display,
                fontWeight: 700,
                fontSize: 14,
                letterSpacing: "0.08em",
                cursor: isPartyFull || isInParty ? "not-allowed" : "pointer",
                marginTop: 24,
                transition: "filter 0.15s, transform 0.1s",
                ...(isPartyFull || isInParty
                  ? {
                      background: "rgba(255,255,255,0.04)",
                      color: "#4B5563",
                      border: "1px solid rgba(255,255,255,0.06)",
                    }
                  : {
                      background: `linear-gradient(135deg, #B4965A 0%, ${colors.gold} 50%, #B4965A 100%)`,
                      color: "#0d0b07",
                    }),
              }}
              onMouseEnter={(e) => {
                if (!isPartyFull && !isInParty) e.currentTarget.style.filter = "brightness(1.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.filter = "none";
              }}
              onMouseDown={(e) => {
                if (!isPartyFull && !isInParty) e.currentTarget.style.transform = "scale(0.99)";
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              {isPartyFull ? "Party Full" : isInParty ? "Already in Party" : "⊕  Add to Party"}
            </button>
          }
        />

        <PartyRosterPanel
          party={party}
          onRemove={handleRemove}
          emptyTitle="No party members"
          emptyHint="Select a class and add them to your party"
        />
      </div>
    </>
  );
}

// Static style objects hoisted out of the render path.
const partySelectionStyle: CSSProperties = {
  display: "flex",
  height: "100vh",
  background: "#111009",
  fontFamily: fonts.body,
  color: colors.text,
  overflow: "hidden",
};
const partySelectionStyle2: CSSProperties = {
  width: 260,
  flexShrink: 0,
  borderRight: "1px solid rgba(180,140,80,0.12)",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
  background: "rgba(0,0,0,0.25)",
};
const partySelectionStyle3: CSSProperties = {
  margin: 0,
  fontSize: 11,
  fontWeight: 700,
  color: colors.goldMuted,
  fontFamily: fonts.display,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
};
const partySelectionStyle4: CSSProperties = {
  flex: 1,
  overflowY: "auto",
  padding: "8px 10px",
  display: "flex",
  flexDirection: "column",
  gap: 4,
};
const partySelectionStyle5: CSSProperties = {
  width: 64,
  height: 64,
  flexShrink: 0,
  background: "rgba(0,0,0,0.5)",
  borderRadius: 6,
  overflow: "hidden",
  border: "1px solid rgba(255,255,255,0.06)",
};
const partySelectionStyle6: CSSProperties = {
  width: 64,
  height: 64,
  imageRendering: "pixelated",
};
const partySelectionStyle7: CSSProperties = {
  width: 7,
  height: 7,
  background: colors.success,
  borderRadius: "50%",
  flexShrink: 0,
};
