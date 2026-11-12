import { CharacterData, formatDamageDice } from "@/types/Character";
import { EquippableItem } from "@/types/Item";
import { colors, fonts } from "@/theme";
import { StatBar } from "../../Shared/StatBar";
import { SectionHeader } from "./SectionHeader";

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
    <div
      style={{
        flex: 1,
        overflowY: "auto",
        borderRight: `1px solid ${colors.goldBorder}`,
      }}
    >
      {character ? (
        <div style={{ padding: "28px 28px 48px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 20,
              marginBottom: 24,
              padding: "20px 20px",
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(180,140,80,0.12)",
              borderRadius: 10,
            }}
          >
            <div
              style={{
                width: 96,
                height: 96,
                flexShrink: 0,
                background: "rgba(0,0,0,0.5)",
                border: "1px solid rgba(180,140,80,0.2)",
                borderRadius: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <img
                src={character.img || "/placeholder.svg"}
                alt={character.name}
                style={{
                  width: 80,
                  height: 80,
                  imageRendering: "pixelated",
                  filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.7))",
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <h3
                style={{
                  margin: "0 0 8px",
                  fontSize: 28,
                  fontWeight: 700,
                  color: colors.text,
                  fontFamily: fonts.display,
                  letterSpacing: "0.03em",
                  lineHeight: 1.1,
                }}
              >
                {character.name}
              </h3>
              <div
                style={{
                  display: "flex",
                  gap: 6,
                  flexWrap: "wrap",
                  marginBottom: 14,
                }}
              >
                {[
                  character.race,
                  character.class,
                  `Level ${character.level}`,
                ].map((tag) => (
                  <span
                    key={tag}
                    style={{
                      fontSize: 12,
                      color: colors.goldMuted,
                      background: "rgba(180,140,80,0.1)",
                      border: `1px solid ${colors.goldBorder}`,
                      borderRadius: 4,
                      padding: "3px 10px",
                      fontFamily: fonts.display,
                      letterSpacing: "0.04em",
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                }}
              >
                {[
                  {
                    label: "HP",
                    value: character.hp,
                    max: character.maxHp,
                    color: "#EF4444",
                  },
                  {
                    label: "MP",
                    value: character.mp,
                    max: character.maxMp,
                    color: "#6366F1",
                  },
                ].map(({ label, value, max, color }) => (
                  <div key={label}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: 5,
                      }}
                    >
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

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 20,
            }}
          >
            <div>
              <SectionHeader>Ability Scores</SectionHeader>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 6,
                }}
              >
                {Object.entries(character.abilities).map(([key, ability]) => (
                  <div
                    key={key}
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(180,140,80,0.12)",
                      borderRadius: 7,
                      padding: "12px 10px",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        background: "rgba(0,0,0,0.3)",
                        borderRadius: 5,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 20,
                          fontWeight: 700,
                          color: colors.text,
                          fontFamily: fonts.display,
                          lineHeight: 1,
                        }}
                      >
                        {ability.score}
                      </span>
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: 10,
                          color: colors.textMuted,
                          fontFamily: fonts.display,
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                        }}
                      >
                        {key}
                      </div>
                      {showAbilityModifiers && (
                        <div
                          style={{
                            fontSize: 13,
                            color:
                              ability.modifier >= 0
                                ? colors.success
                                : colors.danger,
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
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 6,
                      }}
                    >
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
                          <div
                            key={idx}
                            className="gear-card"
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 12,
                              background: "rgba(255,255,255,0.03)",
                              border: "1px solid rgba(180,140,80,0.12)",
                              borderRadius: 7,
                              padding: "10px 12px",
                              transition:
                                "border-color 0.12s, background 0.12s",
                            }}
                          >
                            <div
                              style={{
                                width: 72,
                                height: 72,
                                background: "rgba(0,0,0,0.4)",
                                borderRadius: 6,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                              }}
                            >
                              <img
                                src={item.img || "/placeholder.svg"}
                                alt={item.name}
                                style={{
                                  width: 64,
                                  height: 64,
                                  imageRendering: "pixelated",
                                }}
                              />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div
                                style={{
                                  fontSize: 14,
                                  fontWeight: 700,
                                  color: colors.text,
                                  fontFamily: fonts.display,
                                }}
                              >
                                {item.name}
                              </div>
                              <div
                                style={{
                                  fontSize: 12,
                                  color: colors.textMuted,
                                  marginTop: 1,
                                }}
                              >
                                {item.action?.type}
                              </div>
                              <div
                                style={{
                                  display: "flex",
                                  gap: 12,
                                  marginTop: 3,
                                }}
                              >
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
                                      Dmg:{" "}
                                      {formatDamageDice(item.action.damage)}
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
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 6,
                    }}
                  >
                    {character.spells.map((spell, idx) => (
                      <div
                        key={idx}
                        className="gear-card"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          background: "rgba(255,255,255,0.03)",
                          border: "1px solid rgba(180,140,80,0.12)",
                          borderRadius: 7,
                          padding: "10px 12px",
                          transition:
                            "border-color 0.12s, background 0.12s",
                        }}
                      >
                        <div
                          style={{
                            width: 72,
                            height: 72,
                            background: "rgba(0,0,0,0.4)",
                            borderRadius: 6,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <img
                            src={spell.image || "/placeholder.svg"}
                            alt={spell.name}
                            style={{
                              width: 64,
                              height: 64,
                              imageRendering: "pixelated",
                            }}
                          />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: 14,
                              fontWeight: 700,
                              color: colors.text,
                              fontFamily: fonts.display,
                            }}
                          >
                            {spell.name}
                          </div>
                          <div
                            style={{
                              fontSize: 12,
                              color: "#6366F1",
                              marginTop: 1,
                            }}
                          >
                            {spell.manaCost} MP
                          </div>
                          <div
                            style={{
                              display: "flex",
                              gap: 12,
                              marginTop: 3,
                            }}
                          >
                            <span style={{ fontSize: 11, color: "#6B5E48" }}>
                              Hit: 6
                            </span>
                            <span style={{ fontSize: 11, color: "#6B5E48" }}>
                              Dmg: 8
                            </span>
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
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            color: "#4B5563",
            fontFamily: fonts.display,
            fontSize: 14,
          }}
        >
          {emptyMessage}
        </div>
      )}
    </div>
  );
}
