import { useState } from "react";
import { CharacterData, tempRanger } from "../types/Character";
import CharacterSheet from "./CharacterSheet";
import { useGameStore } from "@/state/GameState";

interface Props {
  party: CharacterData[];
}

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
  const isLow = pct <= 25;
  return (
    <div
      style={{
        height: 4,
        background: "rgba(0,0,0,0.5)",
        borderRadius: 2,
        overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.04)",
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${pct}%`,
          background: isLow ? "#EF4444" : color,
          borderRadius: 2,
          transition: "width 0.4s ease",
          boxShadow: isLow ? "0 0 6px rgba(239,68,68,0.5)" : "none",
        }}
      />
    </div>
  );
}

import { colors, fonts } from "../theme";

export default function Party({ party }: Props) {
  const [selectedCharacter, setSelectedCharacter] =
    useState<CharacterData>(tempRanger);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isTargeting = useGameStore((state) => state.isTargeting);
  const targetingSpell = useGameStore((state) => state.targetingSpell);
  const castSpell = useGameStore((state) => state.castSpell);
  const setTargeting = useGameStore((state) => state.setTargeting);
  const setTargetingSpell = useGameStore((state) => state.setTargetingSpell);

  const isTargetingHeal =
    isTargeting &&
    targetingSpell &&
    targetingSpell.effect.type === "heal" &&
    targetingSpell.effect.target === "single";

  const handleCharacterClick = (character: CharacterData) => {
    if (isTargetingHeal) {
      if (!character.alive || character.hp <= 0) return;
      castSpell(targetingSpell, character);
      setTargeting(false);
      setTargetingSpell(null);
    } else {
      setSelectedCharacter(character);
      setIsModalOpen(true);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700&family=Lato:wght@400;700&display=swap');
        @keyframes heal-pulse { 0%,100% { box-shadow: 0 0 8px rgba(52,211,153,0.3); } 50% { box-shadow: 0 0 18px rgba(52,211,153,0.6); } }
        .party-card { transition: border-color 0.15s, background 0.15s, transform 0.15s; }
        .party-card:hover { transform: translateY(-1px); }
        .party-card-heal { animation: heal-pulse 1.2s ease-in-out infinite; }
      `}</style>

      {isTargetingHeal && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            padding: "8px 16px",
            background: "rgba(5,150,105,0.12)",
            border: `1px solid ${colors.success}`,
            borderRadius: 6,
            marginBottom: 8,
          }}
        >
          <div
            style={{
              width: 6,
              height: 6,
              background: colors.success,
              borderRadius: "50%",
              boxShadow: "0 0 6px rgba(52,211,153,0.8)",
            }}
          />
          <span
            style={{
              fontSize: 12,
              color: "#6EE7B7",
              fontFamily: fonts.display,
              letterSpacing: "0.06em",
            }}
          >
            Select a party member to heal
          </span>
        </div>
      )}

      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          gap: 8,
          overflowX: "auto",
          overflowY: "hidden",
        }}
      >
        {party.map((character, i) => {
          const isDead = character.alive === false || character.hp <= 0;
          const hpPct = (character.hp / character.maxHp) * 100;
          const isLowHp = hpPct <= 25 && !isDead;

          return (
        <div
          key={i}
          onClick={() => !isDead && handleCharacterClick(character)}
          style={{
                flexShrink: 0,
                flex: 1,
                minWidth: 0,
                maxWidth: 240,
                height: "100%",
                display: "flex",
                flexDirection: "column",
                background: isDead
                  ? "rgba(0,0,0,0.2)"
                  : isLowHp
                    ? "rgba(239,68,68,0.05)"
                    : "rgba(255,255,255,0.025)",
                border: `1px solid ${isDead ? "rgba(255,255,255,0.05)" : isLowHp ? "rgba(239,68,68,0.3)" : "rgba(180,140,80,0.18)"}`,
                borderRadius: 6,
                overflow: "hidden",
                opacity: isDead ? 0.4 : 1,
                filter: isDead ? "grayscale(1)" : "none",
                cursor: isDead ? "default" : "pointer",
              }}
            >
              <div
                style={{
                  flex: 1,
                  minHeight: 0,
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <img
                  src={character.img}
                  alt={character.name}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    imageRendering: "pixelated",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: "12px 5px 3px",
                    background:
                      "linear-gradient(to top, rgba(0,0,0,0.9), transparent)",
                  }}
                >
                  <div
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      color: colors.text,
                      fontFamily: fonts.display,
                      letterSpacing: "0.03em",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {character.name}
                  </div>
                </div>
                {isDead && (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: "rgba(0,0,0,0.5)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 9,
                        color: colors.muted,
                        fontFamily: fonts.display,
                        letterSpacing: "0.08em",
                      }}
                    >
                      FALLEN
                    </span>
                  </div>
                )}
              </div>

              <div
                style={{
                  padding: "5px 6px 6px",
                  background: "rgba(0,0,0,0.3)",
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 2,
                  }}
                >
                  <span
                    style={{
                      fontSize: 8,
                      color: isLowHp ? colors.danger : colors.muted,
                      fontFamily: fonts.display,
                      fontWeight: 700,
                      letterSpacing: "0.06em",
                    }}
                  >
                    HP
                  </span>
                  <span
                    style={{
                      fontSize: 8,
                      color: isLowHp ? colors.danger : colors.textMuted,
                      fontFamily: fonts.body,
                    }}
                  >
                    {character.hp}/{character.maxHp}
                  </span>
                </div>
                <div style={{ marginBottom: 4 }}>
                  <StatBar value={character.hp} max={character.maxHp} color={isLowHp ? colors.danger : colors.success} />
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 2,
                  }}
                >
                  <span
                    style={{
                      fontSize: 8,
                      color: colors.muted,
                      fontFamily: fonts.display,
                      fontWeight: 700,
                      letterSpacing: "0.06em",
                    }}
                  >
                    MP
                  </span>
                  <span
                    style={{
                      fontSize: 8,
                      color: colors.textMuted,
                      fontFamily: fonts.body,
                    }}
                  >
                    {character.mp}/{character.maxMp}
                  </span>
                </div>
                <div>
                  <StatBar value={character.mp} max={character.maxMp} color="#6366F1" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <CharacterSheet
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        characterData={selectedCharacter}
      />
    </>
  );
}
