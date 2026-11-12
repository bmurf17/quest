import { useState } from "react";
import type { CharacterData } from "@/types/Character";
import { colors, fonts } from "@/theme";
import { StatBar } from "@/components/shared/StatBar";
import { CharacterDetailPanel } from "@/components/Party/shared/CharacterDetailPanel";
import { PartyRosterPanel } from "@/components/Party/shared/PartyRosterPanel";
import type { CSSProperties } from "react";

export function ManagePartyView({
  party,
  setParty,
  updateParty,
}: {
  party: CharacterData[];
  setParty: (chars: CharacterData[]) => void;
  updateParty: (chars: CharacterData[]) => void;
}) {
  const [selectedCharacter, setSelectedCharacter] =
    useState<CharacterData | null>(party[0] || null);

  const handleRemove = (index: number) => {
    const next = party.filter((_, i) => i !== index);
    setParty(next);
    updateParty(next);
    if (selectedCharacter && !next.includes(selectedCharacter)) {
      setSelectedCharacter(next[0] || null);
    }
  };

  return (
    <>

      <div
        style={managePartyViewStyle}
      >
        <div
          style={{
            padding: "20px 18px 14px",
            borderBottom: "1px solid rgba(180,140,80,0.1)",
          }}
        >
          <h2
            style={managePartyViewStyle2}
          >
            Party Members
          </h2>
        </div>
        <div
          className="scrollbar-thin"
          style={managePartyViewStyle3}
        >
          {party.map((character, i) => {
            const active = selectedCharacter?.name === character.name;
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
                  background: active
                    ? "rgba(212,175,55,0.09)"
                    : "transparent",
                  cursor: "pointer",
                  transition: "background 0.12s, border-color 0.12s",
                  font: "inherit",
                  textAlign: "left",
                  width: "100%",
                }}
              >
                <div
                  style={managePartyViewStyle4}
                >
                  <img
                    src={character.img}
                    alt={character.name}
                    style={managePartyViewStyle5}
                  />
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
                  <StatBar
                    value={character.hp}
                    max={character.maxHp}
                    color={colors.danger}
                  />
                  <div style={{ marginTop: 4 }}>
                    <StatBar
                      value={character.mp}
                      max={character.maxMp}
                      color="#6366F1"
                    />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <CharacterDetailPanel
        character={selectedCharacter}
        showAbilityModifiers={false}
        emptyMessage="Select a party member to view"
      />

      <PartyRosterPanel
        party={party}
        onRemove={handleRemove}
        emptyTitle="No party members"
      />
    </>
  );
}

// Static style objects hoisted out of the render path.
const managePartyViewStyle: CSSProperties = {
  width: 260,
  flexShrink: 0,
  borderRight: "1px solid rgba(180,140,80,0.12)",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
  background: "rgba(0,0,0,0.25)",
};
const managePartyViewStyle2: CSSProperties = {
  margin: 0,
  fontSize: 11,
  fontWeight: 700,
  color: colors.goldMuted,
  fontFamily: fonts.display,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
};
const managePartyViewStyle3: CSSProperties = {
  flex: 1,
  overflowY: "auto",
  padding: "8px 10px",
  display: "flex",
  flexDirection: "column",
  gap: 4,
};
const managePartyViewStyle4: CSSProperties = {
  width: 64,
  height: 64,
  flexShrink: 0,
  background: "rgba(0,0,0,0.5)",
  borderRadius: 6,
  overflow: "hidden",
  border: "1px solid rgba(255,255,255,0.06)",
};
const managePartyViewStyle5: CSSProperties = {
  width: 64,
  height: 64,
  imageRendering: "pixelated",
};
