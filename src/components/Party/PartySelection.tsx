import { useState } from "react";
import { CharacterData, formatDamageDice } from "../../types/Character";
import { useGameStore, GameState } from "@/state/GameState";
import { Link } from "react-router-dom";
import { colors, fonts } from "@/theme";

interface PartyPickerProps {
  availableCharacters: CharacterData[];
}

const MAX_PARTY_SIZE = 6;

function StatBar({
  value,
  max,
  color,
}: {
  value: number;
  max: number;
  color: string;
}) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div
      style={{
        height: 5,
        background: "rgba(255,255,255,0.07)",
        borderRadius: 3,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${pct}%`,
          background: color,
          borderRadius: 3,
          transition: "width 0.3s",
        }}
      />
    </div>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        margin: "22px 0 10px",
      }}
    >
      <span
        style={{
          fontSize: 11,
          color: colors.goldMuted,
          fontFamily: fonts.display,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          fontWeight: 700,
          whiteSpace: "nowrap",
        }}
      >
        {children}
      </span>
      <div style={{ flex: 1, height: 1, background: colors.goldBorder }} />
    </div>
  );
}

export function PartySelection({ availableCharacters }: PartyPickerProps) {
  const [selectedCharacter, setSelectedCharacter] =
    useState<CharacterData | null>(availableCharacters[0] || null);
  const [party, setParty] = useState<CharacterData[]>(
    useGameStore((state: GameState) => state.party),
  );
  const updateParty = useGameStore((state: GameState) => state.setParty);
  const enterCombat = useGameStore((state: GameState) => state.enterCombat);

  const isInParty = selectedCharacter
    ? party.some((m) => m.class === selectedCharacter.class)
    : false;
  const isPartyFull = party.length >= MAX_PARTY_SIZE;

  const handleAddToParty = () => {
    if (selectedCharacter && !isPartyFull && !isInParty) {
      const next = [...party, selectedCharacter];
      setParty(next);
      updateParty(next);
    }
  };

  const handleRemove = (index: number) => {
    const next = party.filter((_, i) => i !== index);
    setParty(next);
    updateParty(next);
  };

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(180,140,80,0.2); border-radius: 2px; }
        .char-row:hover { background: rgba(212,175,55,0.07) !important; border-color: rgba(212,175,55,0.25) !important; }
        .gear-card:hover { border-color: rgba(180,140,80,0.28) !important; background: rgba(255,255,255,0.05) !important; }
        .remove-btn:hover { background: rgba(220,38,38,0.22) !important; }
      `}</style>

      <div
        style={{
          display: "flex",
          height: "100vh",
          background: "#111009",
          fontFamily: fonts.body,
          color: colors.text,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: 260,
            flexShrink: 0,
            borderRight: "1px solid rgba(180,140,80,0.12)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            background: "rgba(0,0,0,0.25)",
          }}
        >
          <div
            style={{
              padding: "20px 18px 14px",
              borderBottom: "1px solid rgba(180,140,80,0.1)",
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: 11,
                fontWeight: 700,
                color: colors.goldMuted,
                fontFamily: fonts.display,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
              }}
            >
              Choose Class
            </h2>
          </div>
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "8px 10px",
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}
          >
            {availableCharacters.map((character, i) => {
              const active = selectedCharacter?.class === character.class;
              const inParty = party.some((m) => m.class === character.class);
              return (
                <div
                  key={i}
                  className="char-row"
                  onClick={() => setSelectedCharacter(character)}
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
                  }}
                >
                  <div
                    style={{
                      width: 64,
                      height: 64,
                      flexShrink: 0,
                      background: "rgba(0,0,0,0.5)",
                      borderRadius: 6,
                      overflow: "hidden",
                      border: "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    <img
                      src={character.img}
                      alt={character.name}
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
                  {inParty && (
                    <div
                      style={{
                        width: 7,
                        height: 7,
                        background: colors.success,
                        borderRadius: "50%",
                        flexShrink: 0,
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div
          style={{
            flex: 1,
            overflowY: "auto",
            borderRight: `1px solid ${colors.goldBorder}`,
          }}
        >
          {selectedCharacter ? (
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
                    src={selectedCharacter.img || "/placeholder.svg"}
                    alt={selectedCharacter.name}
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
                    {selectedCharacter.name}
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
                      selectedCharacter.race,
                      selectedCharacter.class,
                      `Level ${selectedCharacter.level}`,
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
                        value: selectedCharacter.hp,
                        max: selectedCharacter.maxHp,
                        color: "#EF4444",
                      },
                      {
                        label: "MP",
                        value: selectedCharacter.mp,
                        max: selectedCharacter.maxMp,
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
                              color: color,
                              fontFamily: fonts.display,
                              fontWeight: 700,
                              letterSpacing: "0.06em",
                            }}
                          >
                            {label}
                          </span>
                          <span
                            style={{ fontSize: 12, color: colors.textMuted }}
                          >
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
                    {Object.entries(selectedCharacter.abilities).map(
                      ([key, ability]) => (
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
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                </div>

                <div>
                  {selectedCharacter.items?.length > 0 && (
                    <>
                      <SectionHeader>Equipment</SectionHeader>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 6,
                        }}
                      >
                        {selectedCharacter.items.map((item, idx) => (
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
                                alt={item.action.name}
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
                                {item.action.name}
                              </div>
                              <div
                                style={{
                                  fontSize: 12,
                                  color: colors.textMuted,
                                  marginTop: 1,
                                }}
                              >
                                {item.action.type}
                              </div>
                              <div
                                style={{
                                  display: "flex",
                                  gap: 12,
                                  marginTop: 3,
                                }}
                              >
                                <span
                                  style={{ fontSize: 11, color: "#6B5E48" }}
                                >
                                  Hit: {item.action.hitDC}
                                </span>
                                <span
                                  style={{ fontSize: 11, color: "#6B5E48" }}
                                >
                                  Dmg: {formatDamageDice(item.action.damage)}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {selectedCharacter.spells?.length > 0 && (
                    <>
                      <SectionHeader>Skills</SectionHeader>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 6,
                        }}
                      >
                        {selectedCharacter.spells.map((spell, idx) => (
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
                                <span
                                  style={{ fontSize: 11, color: "#6B5E48" }}
                                >
                                  Hit: 6
                                </span>
                                <span
                                  style={{ fontSize: 11, color: "#6B5E48" }}
                                >
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
              </div>

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
                        background:
                          "linear-gradient(135deg, #B4965A 0%, #D4AF37 50%, #B4965A 100%)",
                        color: "#0d0b07",
                      }),
                }}
                onMouseEnter={(e) => {
                  if (!isPartyFull && !isInParty)
                    e.currentTarget.style.filter = "brightness(1.08)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.filter = "none";
                }}
                onMouseDown={(e) => {
                  if (!isPartyFull && !isInParty)
                    e.currentTarget.style.transform = "scale(0.99)";
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                }}
              >
                {isPartyFull
                  ? "Party Full"
                  : isInParty
                    ? "Already in Party"
                    : "⊕  Add to Party"}
              </button>
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
              Select a class to preview
            </div>
          )}
        </div>

        <div
          style={{
            width: 320,
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            background: "rgba(0,0,0,0.2)",
          }}
        >
          <div
            style={{
              padding: "20px 18px 14px",
              borderBottom: `1px solid ${colors.goldBorder}`,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: 11,
                  fontWeight: 700,
                  color: colors.goldMuted,
                  fontFamily: fonts.display,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                }}
              >
                Your Party
              </h2>
              <span
                style={{
                  fontSize: 12,
                  color:
                    party.length === MAX_PARTY_SIZE
                      ? colors.gold
                      : colors.muted,
                  fontFamily: fonts.display,
                  background:
                    party.length === MAX_PARTY_SIZE
                      ? "rgba(212,175,55,0.1)"
                      : "rgba(255,255,255,0.04)",
                  border: `1px solid ${party.length === MAX_PARTY_SIZE ? "rgba(212,175,55,0.3)" : "rgba(255,255,255,0.08)"}`,
                  borderRadius: 10,
                  padding: "2px 8px",
                }}
              >
                {party.length}/{MAX_PARTY_SIZE}
              </span>
            </div>
          </div>

          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "10px 12px",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            {party.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 16px" }}>
                <p
                  style={{
                    margin: "0 0 6px",
                    color: "#4B5563",
                    fontSize: 13,
                    fontFamily: fonts.display,
                  }}
                >
                  No party members
                </p>
                <p style={{ margin: 0, color: "#374151", fontSize: 13 }}>
                  Select a class and add them to your party
                </p>
              </div>
            ) : (
              party.map((member, index) => (
                <div
                  key={index}
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(180,140,80,0.14)",
                    borderRadius: 8,
                  }}
                >
                  <div
                    style={{
                      padding: "9px 12px",
                      borderBottom: "1px solid rgba(180,140,80,0.09)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: colors.text,
                          fontFamily: fonts.display,
                        }}
                      >
                        {member.name}
                      </div>
                      <div
                        style={{ fontSize: 11, color: "#7A6A52", marginTop: 1 }}
                      >
                        {member.class} · Lv {member.level}
                      </div>
                    </div>
                    <button
                      className="remove-btn"
                      onClick={() => handleRemove(index)}
                      style={{
                        background: "rgba(220,38,38,0.1)",
                        border: "1px solid rgba(220,38,38,0.2)",
                        borderRadius: 4,
                        color: "#FCA5A5",
                        fontSize: 11,
                        padding: "4px 10px",
                        cursor: "pointer",
                        transition: "background 0.12s",
                        fontFamily: fonts.body,
                      }}
                    >
                      Remove
                    </button>
                  </div>
                  <div
                    style={{
                      padding: "12px",
                      display: "flex",
                      gap: 12,
                      alignItems: "flex-start",
                    }}
                  >
                    <img
                      src={member.img || "/placeholder.svg"}
                      alt={member.name}
                      style={{
                        width: 72,
                        height: 72,
                        imageRendering: "pixelated",
                        filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.6))",
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: 4,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 11,
                            color: colors.danger,
                            fontFamily: fonts.display,
                            fontWeight: 700,
                            letterSpacing: "0.06em",
                          }}
                        >
                          HP
                        </span>
                        <span style={{ fontSize: 12, color: colors.textMuted }}>
                          {member.hp}/{member.maxHp}
                        </span>
                      </div>
                      <StatBar
                        value={member.hp}
                        max={member.maxHp}
                        color="#EF4444"
                      />
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginTop: 8,
                          marginBottom: 4,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 11,
                            color: "#6366F1",
                            fontFamily: fonts.display,
                            fontWeight: 700,
                            letterSpacing: "0.06em",
                          }}
                        >
                          MP
                        </span>
                        <span style={{ fontSize: 12, color: colors.textMuted }}>
                          {member.mp}/{member.maxMp}
                        </span>
                      </div>
                      <StatBar
                        value={member.mp}
                        max={member.maxMp}
                        color="#6366F1"
                      />
                      <div
                        style={{
                          display: "flex",
                          gap: 6,
                          marginTop: 10,
                          flexWrap: "wrap",
                        }}
                      >
                        {Object.entries(member.abilities)
                          .slice(0, 4)
                          .map(([key, ability]) => (
                            <div
                              key={key}
                              style={{
                                textAlign: "center",
                                background: "rgba(0,0,0,0.25)",
                                borderRadius: 4,
                                padding: "4px 7px",
                                minWidth: 34,
                              }}
                            >
                              <div
                                style={{
                                  fontSize: 9,
                                  color: "#7A6A52",
                                  fontFamily: fonts.display,
                                  letterSpacing: "0.08em",
                                  textTransform: "uppercase",
                                }}
                              >
                                {key}
                              </div>
                              <div
                                style={{
                                  fontSize: 13,
                                  fontWeight: 700,
                                  color: "#D4C8B0",
                                  fontFamily: fonts.display,
                                }}
                              >
                                {ability.score}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {party.length > 0 && (
            <div
              style={{
                padding: "12px",
                borderTop: `1px solid ${colors.goldBorder}`,
                flexShrink: 0,
              }}
            >
              <Link to="/game" style={{ textDecoration: "none" }}>
                <button
                  onClick={enterCombat}
                  style={{
                    width: "100%",
                    padding: "14px",
                    background: `linear-gradient(135deg, ${colors.gold} 0%, ${colors.gold} 50%, ${colors.gold} 100%)`,
                    border: "none",
                    borderRadius: 8,
                    color: "#0d0b07",
                    fontSize: 13,
                    fontWeight: 700,
                    fontFamily: fonts.display,
                    letterSpacing: "0.06em",
                    cursor: "pointer",
                    transition: "filter 0.15s, transform 0.1s",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.filter = "brightness(1.08)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.filter = "none";
                  }}
                  onMouseDown={(e) => {
                    e.currentTarget.style.transform = "scale(0.98)";
                  }}
                  onMouseUp={(e) => {
                    e.currentTarget.style.transform = "scale(1)";
                  }}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    width={15}
                    height={15}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                    />
                  </svg>
                  Begin Adventure
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
