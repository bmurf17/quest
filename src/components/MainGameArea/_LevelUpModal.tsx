import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { CharacterData } from "@/types/Character";
import { useState, memo } from "react";
import { Plus, Minus } from "lucide-react";
import { useGameStore } from "@/state/GameState";
import { colors, fonts } from "@/theme";
import { StatBar } from "@/components/shared/StatBar";
import type { CSSProperties } from "react";

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div style={sectionHeaderStyle}>
      <span
        style={sectionHeaderStyle2}
      >
        {children}
      </span>
      <div style={sectionHeaderStyle3} />
    </div>
  );
}

function LevelUpModalComponent() {
  const { levelingUpChars, currentLevelingCharIndex, applyLevelUp } =
    useGameStore();

  const currentChar = levelingUpChars[currentLevelingCharIndex];
  const [statPoints, setStatPoints] = useState(3);
  const [allocatedStats, setAllocatedStats] = useState<Record<string, number>>({
    str: 0,
    dex: 0,
    con: 0,
    int: 0,
    wis: 0,
    cha: 0,
    def: 0,
  });

  if (!currentChar || currentLevelingCharIndex === -1) return null;

  const remainingChars =
    levelingUpChars.length - currentLevelingCharIndex - 1;

  const incrementStat = (stat: string) => {
    if (statPoints > 0) {
      setAllocatedStats((prev) => ({ ...prev, [stat]: prev[stat] + 1 }));
      setStatPoints((prev) => prev - 1);
    }
  };

  const decrementStat = (stat: string) => {
    if (allocatedStats[stat] > 0) {
      setAllocatedStats((prev) => ({ ...prev, [stat]: prev[stat] - 1 }));
      setStatPoints((prev) => prev + 1);
    }
  };

  const calculateModifier = (score: number) => Math.floor((score - 10) / 2);

  const handleConfirm = () => {
    const updatedAbilities = { ...currentChar.abilities };
    Object.entries(allocatedStats).forEach(([stat, points]) => {
      const key = stat as keyof typeof updatedAbilities;
      const newScore = updatedAbilities[key].score + points;
      updatedAbilities[key] = { score: newScore, modifier: calculateModifier(newScore) };
    });

    const conIncrease = allocatedStats.con;
    const hpIncrease = conIncrease > 0 ? conIncrease : 0;

    const updatedChar: CharacterData = {
      ...currentChar,
      level: currentChar.level + 1,
      exp: currentChar.exp - currentChar.nextLevelExp,
      nextLevelExp: Math.floor(currentChar.nextLevelExp * 1.5),
      abilities: updatedAbilities,
      maxHp: currentChar.maxHp + hpIncrease,
      hp: currentChar.hp + hpIncrease,
    };

    setStatPoints(3);
    setAllocatedStats({ str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0, def: 0 });
    applyLevelUp(updatedChar);
  };

  return (
    <Dialog open={true} onOpenChange={() => {}}>
      <DialogContent
        style={levelUpModalComponentStyle}
      >
        <DialogHeader
          style={{
            padding: "20px 24px 16px",
            borderBottom: `1px solid ${colors.goldBorder}`,
          }}
        >
          <div style={levelUpModalComponentStyle2}>
            <div
              style={levelUpModalComponentStyle3}
            >
              <img
                src={currentChar.img}
                alt={currentChar.name}
                style={levelUpModalComponentStyle4}
              />
            </div>

            <div style={{ flex: 1 }}>
              <DialogTitle
                style={levelUpModalComponentStyle5}
              >
                Level Up!
              </DialogTitle>
              <div style={levelUpModalComponentStyle6}>
                {[
                  currentChar.race,
                  currentChar.class,
                  `${currentChar.level} → ${currentChar.level + 1}`,
                ].map((tag) => (
                  <span
                    key={tag}
                    style={levelUpModalComponentStyle7}
                  >
                    {tag}
                  </span>
                ))}
                {remainingChars > 0 && (
                  <span
                    style={levelUpModalComponentStyle8}
                  >
                    +{remainingChars} more waiting
                  </span>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        <div style={{ padding: "4px 24px 24px" }}>
          <SectionHeader>Experience</SectionHeader>
          <div
            style={levelUpModalComponentStyle9}
          >
            <span
              style={{
                fontSize: 11,
                color: colors.warning ?? "#F59E0B",
                fontFamily: fonts.display,
                fontWeight: 700,
                letterSpacing: "0.08em",
              }}
            >
              EXP
            </span>
            <span
              style={levelUpModalComponentStyle10}
            >
              {currentChar.exp}
              <span style={{ color: colors.muted }}>
                /{currentChar.nextLevelExp}
              </span>
            </span>
          </div>
          <StatBar
            value={currentChar.exp}
            max={currentChar.nextLevelExp}
            color={colors.warning}
            radius={3}
            trackColor="rgba(255,255,255,0.06)"
            border={false}
            lowThreshold={0}
            style={{ marginTop: 6 }}
          />

          <SectionHeader>Ability Scores</SectionHeader>

          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "5px 12px",
              marginBottom: 12,
              background:
                statPoints === 0
                  ? "rgba(34,197,94,0.08)"
                  : "rgba(180,140,80,0.1)",
              border: `1px solid ${
                statPoints === 0 ? colors.success : colors.goldBorder
              }`,
              borderRadius: 6,
            }}
          >
            <span
              style={{
                fontSize: 12,
                fontFamily: fonts.display,
                fontWeight: 700,
                color: statPoints === 0 ? colors.success : colors.goldMuted,
                letterSpacing: "0.06em",
              }}
            >
              {statPoints === 0
                ? "✓  All points allocated"
                : `${statPoints} stat ${
                    statPoints === 1 ? "point" : "points"
                  } remaining`}
            </span>
          </div>

          <div
            style={levelUpModalComponentStyle11}
          >
            {Object.entries(currentChar.abilities).map(([key, ability]) => {
              const allocated = allocatedStats[key] ?? 0;
              const newScore = ability.score + allocated;
              const newMod = calculateModifier(newScore);

              return (
                <div
                  key={key}
                  style={{
                    background:
                      allocated > 0
                        ? "rgba(180,140,80,0.07)"
                        : "rgba(255,255,255,0.03)",
                    border: `1px solid ${
                      allocated > 0
                        ? colors.goldMuted
                        : colors.goldBorder
                    }`,
                    borderRadius: 7,
                    padding: "10px 6px",
                    textAlign: "center",
                    transition: "border-color 0.2s, background 0.2s",
                  }}
                >
                  <div
                    style={levelUpModalComponentStyle12}
                  >
                    {key}
                  </div>
                  <div
                    style={levelUpModalComponentStyle13}
                  >
                    {newScore}
                  </div>
                  {allocated > 0 && (
                    <div
                      style={levelUpModalComponentStyle14}
                    >
                      +{allocated}
                    </div>
                  )}
                  <div
                    style={{
                      fontSize: 11,
                      color: newMod >= 0 ? colors.success : colors.danger,
                      marginTop: 2,
                    }}
                  >
                    {newMod >= 0 ? "+" : ""}
                    {newMod}
                  </div>

                  {/* +/- controls */}
                  <div
                    style={levelUpModalComponentStyle15}
                  >
                    <button
                      onClick={() => decrementStat(key)}
                      disabled={allocated === 0}
                      style={{
                        width: 20,
                        height: 20,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background:
                          allocated === 0
                            ? "rgba(255,255,255,0.03)"
                            : "rgba(180,140,80,0.15)",
                        border: `1px solid ${
                          allocated === 0
                            ? "rgba(255,255,255,0.08)"
                            : colors.goldBorder
                        }`,
                        borderRadius: 4,
                        cursor: allocated === 0 ? "not-allowed" : "pointer",
                        color:
                          allocated === 0 ? colors.muted : colors.goldMuted,
                        padding: 0,
                      }}
                    >
                      <Minus size={10} />
                    </button>
                    <button
                      onClick={() => incrementStat(key)}
                      disabled={statPoints === 0}
                      style={{
                        width: 20,
                        height: 20,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background:
                          statPoints === 0
                            ? "rgba(255,255,255,0.03)"
                            : "rgba(180,140,80,0.15)",
                        border: `1px solid ${
                          statPoints === 0
                            ? "rgba(255,255,255,0.08)"
                            : colors.goldBorder
                        }`,
                        borderRadius: 4,
                        cursor: statPoints === 0 ? "not-allowed" : "pointer",
                        color:
                          statPoints === 0 ? colors.muted : colors.goldMuted,
                        padding: 0,
                      }}
                    >
                      <Plus size={10} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Confirm button */}
          <button
            onClick={handleConfirm}
            disabled={statPoints > 0}
            style={{
              marginTop: 20,
              width: "100%",
              padding: "12px 0",
              background:
                statPoints === 0
                  ? "rgba(180,140,80,0.15)"
                  : "rgba(255,255,255,0.03)",
              border: `1px solid ${
                statPoints === 0 ? colors.goldMuted : "rgba(255,255,255,0.08)"
              }`,
              borderRadius: 7,
              color:
                statPoints === 0 ? colors.goldMuted : colors.muted,
              fontFamily: fonts.display,
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              cursor: statPoints === 0 ? "pointer" : "not-allowed",
              transition: "all 0.2s",
            }}
          >
            {remainingChars > 0 ? "Next Character →" : "Confirm Level Up"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default memo(LevelUpModalComponent);

// Static style objects hoisted out of the render path.
const sectionHeaderStyle: CSSProperties = { display: "flex", alignItems: "center", gap: 10, margin: "20px 0 12px" };
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
  const levelUpModalComponentStyle: CSSProperties = {
            maxWidth: 680,
            background: "linear-gradient(160deg, #0d0b07 0%, #1a1209 100%)",
            border: `1px solid ${colors.goldBorder}`,
            borderRadius: 12,
            padding: 0,
            overflow: "hidden",
            fontFamily: fonts.body,
            color: colors.text,
};
const levelUpModalComponentStyle2: CSSProperties = { display: "flex", alignItems: "center", gap: 16 };
  const levelUpModalComponentStyle3: CSSProperties = {
                  width: 64,
                  height: 64,
                  flexShrink: 0,
                  background: "rgba(0,0,0,0.5)",
                  border: `1px solid rgba(180,140,80,0.2)`,
                  borderRadius: 8,
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
};
const levelUpModalComponentStyle4: CSSProperties = {
  width: 56,
  height: 56,
  imageRendering: "pixelated",
  filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.8))",
};
const levelUpModalComponentStyle5: CSSProperties = {
  margin: "0 0 8px",
  fontSize: 22,
  fontWeight: 700,
  color: colors.text,
  fontFamily: fonts.display,
  letterSpacing: "0.04em",
};
const levelUpModalComponentStyle6: CSSProperties = { display: "flex", gap: 6, alignItems: "center" };
  const levelUpModalComponentStyle7: CSSProperties = {
                        fontSize: 11,
                        color: colors.goldMuted,
                        background: "rgba(180,140,80,0.1)",
                        border: `1px solid ${colors.goldBorder}`,
                        borderRadius: 4,
                        padding: "2px 9px",
                        fontFamily: fonts.display,
                        letterSpacing: "0.04em",
};
const levelUpModalComponentStyle8: CSSProperties = {
  fontSize: 11,
  color: colors.textMuted,
  fontFamily: fonts.body,
  marginLeft: "auto",
};
const levelUpModalComponentStyle9: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  marginBottom: 6,
};
const levelUpModalComponentStyle10: CSSProperties = {
  fontSize: 12,
  color: colors.textMuted,
  fontFamily: fonts.body,
};
const levelUpModalComponentStyle11: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(7, 1fr)",
  gap: 6,
};
const levelUpModalComponentStyle12: CSSProperties = {
  fontSize: 9,
  color: colors.textMuted,
  fontFamily: fonts.display,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  marginBottom: 4,
};
const levelUpModalComponentStyle13: CSSProperties = {
  fontSize: 20,
  fontWeight: 700,
  color: colors.text,
  fontFamily: fonts.display,
  lineHeight: 1,
};
const levelUpModalComponentStyle14: CSSProperties = {
  fontSize: 10,
  color: colors.success,
  fontFamily: fonts.display,
  marginTop: 1,
};
const levelUpModalComponentStyle15: CSSProperties = {
  display: "flex",
  justifyContent: "center",
  gap: 3,
  marginTop: 7,
};
