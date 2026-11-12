import type { CharacterData } from "@/types/Character";
import { formatDamageDice } from "@/lib/dice";
import type { EquippableItem } from "@/types/Item";
import { useGameStore } from "@/state/GameState";
import { colors, fonts } from "@/theme";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { CSSProperties } from "react";

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div style={sectionHeaderStyle}>
      <span style={sectionHeaderStyle2}>{children}</span>
      <div style={sectionHeaderStyle3} />
    </div>
  );
}

export function CharacterDetailDialog({
  character,
  isOpen,
  onOpenChange,
  onAddToParty,
  alreadyInParty,
  hasRecruited,
}: {
  character: CharacterData;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onAddToParty: (char: CharacterData) => void;
  alreadyInParty: boolean;
  hasRecruited: boolean;
}) {
  const partyCount = useGameStore((s) => s.party.length);
  const partyFull = partyCount >= 6;
  const canAdd = !alreadyInParty && !partyFull && !hasRecruited;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent style={characterDetailDialogStyle}>
        <DialogHeader
          style={{
            padding: "20px 24px 16px",
            borderBottom: `1px solid ${colors.goldBorder}`,
          }}
        >
          <div style={characterDetailDialogStyle2}>
            <div style={characterDetailDialogStyle3}>
              <img src={character.img} alt={character.name} style={characterDetailDialogStyle4} />
            </div>
            <div style={{ flex: 1 }}>
              <DialogTitle style={characterDetailDialogStyle5}>{character.name}</DialogTitle>
              <div style={{ display: "flex", gap: 6 }}>
                {[character.race, character.class, `Level ${character.level}`].map((tag) => (
                  <span key={tag} style={characterDetailDialogStyle6}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea style={{ maxHeight: "60vh" }}>
          <div style={{ padding: "4px 24px 28px" }}>
            <SectionHeader>Ability Scores</SectionHeader>
            <div style={characterDetailDialogStyle7}>
              {Object.entries(character.abilities).map(([key, ability]) => (
                <div key={key} style={characterDetailDialogStyle8}>
                  <div style={characterDetailDialogStyle9}>{key}</div>
                  <div style={characterDetailDialogStyle10}>{ability.score}</div>
                  <div
                    style={{
                      fontSize: 12,
                      color: ability.modifier >= 0 ? colors.success : colors.danger,
                      marginTop: 3,
                    }}
                  >
                    {ability.modifier >= 0 ? "+" : ""}
                    {ability.modifier}
                  </div>
                </div>
              ))}
            </div>

            {Object.values(character.equipment).filter((i): i is EquippableItem => i !== null)
              .length > 0 && (
              <>
                <SectionHeader>Equipment</SectionHeader>
                <div style={characterDetailDialogStyle11}>
                  {Object.values(character.equipment)
                    .filter((i): i is EquippableItem => i !== null)
                    .map((item) => (
                      <div key={item.name} style={characterDetailDialogStyle12}>
                        <div style={characterDetailDialogStyle13}>
                          <img
                            src={item.img}
                            alt={item.name}
                            style={characterDetailDialogStyle14}
                          />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={characterDetailDialogStyle15}>{item.name}</div>
                          <div style={{ fontSize: 12, color: colors.textMuted }}>
                            {item.action?.type}
                          </div>
                        </div>
                        {item.action && (
                          <div style={characterDetailDialogStyle16}>
                            {[
                              ["Hit", item.action.hitDC],
                              ["Dmg", formatDamageDice(item.action.damage)],
                            ].map(([label, val]) => (
                              <div key={label} style={{ textAlign: "center" }}>
                                <div style={characterDetailDialogStyle17}>{label}</div>
                                <div style={characterDetailDialogStyle18}>{val}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </>
            )}
          </div>
        </ScrollArea>

        <div style={characterDetailDialogStyle19}>
          <button
            onClick={() => onOpenChange(false)}
            style={characterDetailDialogStyle20}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.08)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.04)";
            }}
          >
            Close
          </button>
          <button
            onClick={() => {
              onAddToParty(character);
              onOpenChange(false);
            }}
            disabled={!canAdd}
            style={{
              padding: "10px 24px",
              borderRadius: 6,
              fontFamily: fonts.display,
              fontWeight: 700,
              fontSize: 13,
              letterSpacing: "0.06em",
              cursor: canAdd ? "pointer" : "not-allowed",
              transition: "filter 0.15s, transform 0.1s",
              ...(canAdd
                ? {
                    background: `linear-gradient(135deg, ${colors.gold} 0%, #B4965A 100%)`,
                    color: "#0d0b07",
                    border: "none",
                  }
                : {
                    background: "rgba(255,255,255,0.04)",
                    color: "#4B5563",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }),
            }}
            onMouseEnter={(e) => {
              if (canAdd) e.currentTarget.style.filter = "brightness(1.08)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.filter = "none";
            }}
          >
            {hasRecruited
              ? "Already Recruited"
              : alreadyInParty
                ? "Already in Party"
                : partyFull
                  ? "Party Full"
                  : "⊕  Add to Party"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Static style objects hoisted out of the render path.
const sectionHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  margin: "20px 0 12px",
};
const sectionHeaderStyle2: CSSProperties = {
  fontSize: 11,
  color: colors.goldMuted,
  fontFamily: fonts.display,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  fontWeight: 700,
  whiteSpace: "nowrap",
};
const sectionHeaderStyle3: CSSProperties = { flex: 1, height: 1, background: colors.goldBorder };
const characterDetailDialogStyle: CSSProperties = {
  maxWidth: 640,
  background: "linear-gradient(160deg, #0d0b07 0%, #1a1209 100%)",
  border: `1px solid ${colors.goldBorder}`,
  borderRadius: 12,
  padding: 0,
  overflow: "hidden",
  fontFamily: fonts.body,
  color: colors.text,
};
const characterDetailDialogStyle2: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 16,
};
const characterDetailDialogStyle3: CSSProperties = {
  width: 64,
  height: 64,
  flexShrink: 0,
  background: "rgba(0,0,0,0.5)",
  border: "1px solid rgba(180,140,80,0.2)",
  borderRadius: 8,
  overflow: "hidden",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};
const characterDetailDialogStyle4: CSSProperties = {
  width: 56,
  height: 56,
  imageRendering: "pixelated",
  filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.8))",
};
const characterDetailDialogStyle5: CSSProperties = {
  margin: "0 0 8px",
  fontSize: 22,
  fontWeight: 700,
  color: colors.text,
  fontFamily: fonts.display,
  letterSpacing: "0.04em",
};
const characterDetailDialogStyle6: CSSProperties = {
  fontSize: 11,
  color: colors.goldMuted,
  background: "rgba(180,140,80,0.1)",
  border: `1px solid ${colors.goldBorder}`,
  borderRadius: 4,
  padding: "2px 9px",
  fontFamily: fonts.display,
  letterSpacing: "0.04em",
};
const characterDetailDialogStyle7: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(7, 1fr)",
  gap: 6,
};
const characterDetailDialogStyle8: CSSProperties = {
  background: "rgba(255,255,255,0.03)",
  border: `1px solid ${colors.goldBorder}`,
  borderRadius: 7,
  padding: "10px 6px",
  textAlign: "center",
};
const characterDetailDialogStyle9: CSSProperties = {
  fontSize: 9,
  color: colors.textMuted,
  fontFamily: fonts.display,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  marginBottom: 5,
};
const characterDetailDialogStyle10: CSSProperties = {
  fontSize: 22,
  fontWeight: 700,
  color: colors.text,
  fontFamily: fonts.display,
  lineHeight: 1,
};
const characterDetailDialogStyle11: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
};
const characterDetailDialogStyle12: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: "10px 12px",
  background: "rgba(255,255,255,0.025)",
  border: `1px solid ${colors.goldBorder}`,
  borderRadius: 7,
};
const characterDetailDialogStyle13: CSSProperties = {
  width: 44,
  height: 44,
  flexShrink: 0,
  background: "rgba(0,0,0,0.4)",
  border: `1px solid ${colors.goldBorder}`,
  borderRadius: 6,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};
const characterDetailDialogStyle14: CSSProperties = {
  width: 34,
  height: 34,
  imageRendering: "pixelated",
};
const characterDetailDialogStyle15: CSSProperties = {
  fontSize: 14,
  fontWeight: 700,
  color: colors.text,
  fontFamily: fonts.display,
  marginBottom: 3,
};
const characterDetailDialogStyle16: CSSProperties = { display: "flex", gap: 16, flexShrink: 0 };
const characterDetailDialogStyle17: CSSProperties = {
  fontSize: 9,
  color: colors.textMuted,
  fontFamily: fonts.display,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  marginBottom: 2,
};
const characterDetailDialogStyle18: CSSProperties = {
  fontSize: 14,
  fontWeight: 700,
  color: colors.goldMuted,
  fontFamily: fonts.display,
};
const characterDetailDialogStyle19: CSSProperties = {
  padding: "14px 24px",
  borderTop: `1px solid ${colors.goldBorder}`,
  display: "flex",
  justifyContent: "flex-end",
  gap: 10,
};
const characterDetailDialogStyle20: CSSProperties = {
  padding: "10px 20px",
  background: "rgba(255,255,255,0.04)",
  border: `1px solid ${colors.subtleBorder}`,
  borderRadius: 6,
  color: colors.textMuted,
  fontSize: 13,
  fontFamily: fonts.display,
  fontWeight: 600,
  cursor: "pointer",
  transition: "background 0.12s",
};
