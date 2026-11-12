import type { CharacterData } from "@/types/Character";
import { formatDamageDice } from "@/lib/dice";
import type { EquippableItem } from "@/types/Item";
import { colors, fonts } from "@/theme";
import { StatBar } from "@/components/shared/StatBar";
import { SectionHeader } from "./SectionHeader";
import type { CSSProperties } from "react";

export function CharacterDetailPanel({
  character,
  showAbilityModifiers,
  emptyMessage,
  footer,
}: {
  character: CharacterData | null;
  showAbilityModifiers: boolean;
  emptyMessage: string;
  footer?: React.ReactNode;
}) {
  return (
    <div style={characterDetailPanelStyle}>
      {character ? (
        <div style={{ padding: "28px 28px 48px" }}>
          <div style={characterDetailPanelStyle2}>
            <div style={characterDetailPanelStyle3}>
              <img
                src={character.img || "/placeholder.svg"}
                alt={character.name}
                style={characterDetailPanelStyle4}
              />
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={characterDetailPanelStyle5}>{character.name}</h3>
              <div style={characterDetailPanelStyle6}>
                {[character.race, character.class, `Level ${character.level}`].map((tag) => (
                  <span key={tag} style={characterDetailPanelStyle7}>
                    {tag}
                  </span>
                ))}
              </div>
              <div style={characterDetailPanelStyle8}>
                {[
                  {
                    label: "HP",
                    value: character.hp,
                    max: character.maxHp,
                    color: colors.danger,
                  },
                  {
                    label: "MP",
                    value: character.mp,
                    max: character.maxMp,
                    color: "#6366F1",
                  },
                ].map(({ label, value, max, color }) => (
                  <div key={label}>
                    <div style={characterDetailPanelStyle9}>
                      <span
                        style={{
                          fontSize: 11,
                          color,
                          fontFamily: fonts.display,
                          fontWeight: 700,
                          letterSpacing: "0.06em",
                        }}
                      >
                        {label}
                      </span>
                      <span style={{ fontSize: 12, color: colors.textMuted }}>
                        {value}
                        <span style={{ color: "#5A4E3A" }}>/{max}</span>
                      </span>
                    </div>
                    <StatBar value={value} max={max} color={color} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={characterDetailPanelStyle10}>
            <div>
              <SectionHeader>Ability Scores</SectionHeader>
              <div style={characterDetailPanelStyle11}>
                {Object.entries(character.abilities).map(([key, ability]) => (
                  <div key={key} style={characterDetailPanelStyle12}>
                    <div style={characterDetailPanelStyle13}>
                      <span style={characterDetailPanelStyle14}>{ability.score}</span>
                    </div>
                    <div>
                      <div style={characterDetailPanelStyle15}>{key}</div>
                      {showAbilityModifiers && (
                        <div
                          style={{
                            fontSize: 13,
                            color: ability.modifier >= 0 ? colors.success : colors.danger,
                            marginTop: 1,
                          }}
                        >
                          {ability.modifier >= 0 ? "+" : ""}
                          {ability.modifier}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              {character.equipment &&
                Object.values(character.equipment).some((v) => v !== null) && (
                  <>
                    <SectionHeader>Equipment</SectionHeader>
                    <div style={characterDetailPanelStyle16}>
                      {[
                        character.equipment.helmet,
                        character.equipment.armor,
                        character.equipment.weapon,
                        character.equipment.shield,
                        character.equipment.accessory1,
                        character.equipment.accessory2,
                        character.equipment.boots,
                      ]
                        .filter((i): i is EquippableItem => i !== null)
                        .map((item, idx) => (
                          <div key={idx} className="gear-card" style={characterDetailPanelStyle17}>
                            <div style={characterDetailPanelStyle18}>
                              <img
                                src={item.img || "/placeholder.svg"}
                                alt={item.name}
                                style={characterDetailPanelStyle19}
                              />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={characterDetailPanelStyle20}>{item.name}</div>
                              <div style={characterDetailPanelStyle21}>{item.action?.type}</div>
                              <div style={characterDetailPanelStyle22}>
                                {item.action && (
                                  <>
                                    <span
                                      style={{
                                        fontSize: 11,
                                        color: "#6B5E48",
                                      }}
                                    >
                                      Hit: {item.action.hitDC}
                                    </span>
                                    <span
                                      style={{
                                        fontSize: 11,
                                        color: "#6B5E48",
                                      }}
                                    >
                                      Dmg: {formatDamageDice(item.action.damage)}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </>
                )}

              {character.spells?.length > 0 && (
                <>
                  <SectionHeader>Skills</SectionHeader>
                  <div style={characterDetailPanelStyle23}>
                    {character.spells.map((spell, idx) => (
                      <div key={idx} className="gear-card" style={characterDetailPanelStyle24}>
                        <div style={characterDetailPanelStyle25}>
                          <img
                            src={spell.image || "/placeholder.svg"}
                            alt={spell.name}
                            style={characterDetailPanelStyle26}
                          />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={characterDetailPanelStyle27}>{spell.name}</div>
                          <div style={characterDetailPanelStyle28}>{spell.manaCost} MP</div>
                          <div style={characterDetailPanelStyle29}>
                            <span style={{ fontSize: 11, color: "#6B5E48" }}>Hit: 6</span>
                            <span style={{ fontSize: 11, color: "#6B5E48" }}>Dmg: 8</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {footer}
          </div>
        </div>
      ) : (
        <div style={characterDetailPanelStyle30}>{emptyMessage}</div>
      )}
    </div>
  );
}

// Static style objects hoisted out of the render path.
const characterDetailPanelStyle: CSSProperties = {
  flex: 1,
  overflowY: "auto",
  borderRight: `1px solid ${colors.goldBorder}`,
};
const characterDetailPanelStyle2: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 20,
  marginBottom: 24,
  padding: "20px 20px",
  background: "rgba(255,255,255,0.02)",
  border: "1px solid rgba(180,140,80,0.12)",
  borderRadius: 10,
};
const characterDetailPanelStyle3: CSSProperties = {
  width: 96,
  height: 96,
  flexShrink: 0,
  background: "rgba(0,0,0,0.5)",
  border: "1px solid rgba(180,140,80,0.2)",
  borderRadius: 10,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};
const characterDetailPanelStyle4: CSSProperties = {
  width: 80,
  height: 80,
  imageRendering: "pixelated",
  filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.7))",
};
const characterDetailPanelStyle5: CSSProperties = {
  margin: "0 0 8px",
  fontSize: 28,
  fontWeight: 700,
  color: colors.text,
  fontFamily: fonts.display,
  letterSpacing: "0.03em",
  lineHeight: 1.1,
};
const characterDetailPanelStyle6: CSSProperties = {
  display: "flex",
  gap: 6,
  flexWrap: "wrap",
  marginBottom: 14,
};
const characterDetailPanelStyle7: CSSProperties = {
  fontSize: 12,
  color: colors.goldMuted,
  background: "rgba(180,140,80,0.1)",
  border: `1px solid ${colors.goldBorder}`,
  borderRadius: 4,
  padding: "3px 10px",
  fontFamily: fonts.display,
  letterSpacing: "0.04em",
};
const characterDetailPanelStyle8: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 12,
};
const characterDetailPanelStyle9: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  marginBottom: 5,
};
const characterDetailPanelStyle10: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 20,
};
const characterDetailPanelStyle11: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 6,
};
const characterDetailPanelStyle12: CSSProperties = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(180,140,80,0.12)",
  borderRadius: 7,
  padding: "12px 10px",
  display: "flex",
  alignItems: "center",
  gap: 10,
};
const characterDetailPanelStyle13: CSSProperties = {
  width: 36,
  height: 36,
  background: "rgba(0,0,0,0.3)",
  borderRadius: 5,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};
const characterDetailPanelStyle14: CSSProperties = {
  fontSize: 20,
  fontWeight: 700,
  color: colors.text,
  fontFamily: fonts.display,
  lineHeight: 1,
};
const characterDetailPanelStyle15: CSSProperties = {
  fontSize: 10,
  color: colors.textMuted,
  fontFamily: fonts.display,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
};
const characterDetailPanelStyle16: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
};
const characterDetailPanelStyle17: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(180,140,80,0.12)",
  borderRadius: 7,
  padding: "10px 12px",
  transition: "border-color 0.12s, background 0.12s",
};
const characterDetailPanelStyle18: CSSProperties = {
  width: 72,
  height: 72,
  background: "rgba(0,0,0,0.4)",
  borderRadius: 6,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};
const characterDetailPanelStyle19: CSSProperties = {
  width: 64,
  height: 64,
  imageRendering: "pixelated",
};
const characterDetailPanelStyle20: CSSProperties = {
  fontSize: 14,
  fontWeight: 700,
  color: colors.text,
  fontFamily: fonts.display,
};
const characterDetailPanelStyle21: CSSProperties = {
  fontSize: 12,
  color: colors.textMuted,
  marginTop: 1,
};
const characterDetailPanelStyle22: CSSProperties = {
  display: "flex",
  gap: 12,
  marginTop: 3,
};
const characterDetailPanelStyle23: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
};
const characterDetailPanelStyle24: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(180,140,80,0.12)",
  borderRadius: 7,
  padding: "10px 12px",
  transition: "border-color 0.12s, background 0.12s",
};
const characterDetailPanelStyle25: CSSProperties = {
  width: 72,
  height: 72,
  background: "rgba(0,0,0,0.4)",
  borderRadius: 6,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};
const characterDetailPanelStyle26: CSSProperties = {
  width: 64,
  height: 64,
  imageRendering: "pixelated",
};
const characterDetailPanelStyle27: CSSProperties = {
  fontSize: 14,
  fontWeight: 700,
  color: colors.text,
  fontFamily: fonts.display,
};
const characterDetailPanelStyle28: CSSProperties = {
  fontSize: 12,
  color: "#6366F1",
  marginTop: 1,
};
const characterDetailPanelStyle29: CSSProperties = {
  display: "flex",
  gap: 12,
  marginTop: 3,
};
const characterDetailPanelStyle30: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  height: "100%",
  color: "#4B5563",
  fontFamily: fonts.display,
  fontSize: 14,
};
