import { MAX_SCORE } from "@/consts/constants";
import {
  ABILITY_BASE,
  ABILITY_KEYS,
  remainingAbilityPoints,
} from "@/lib/character";
import { useCharacter } from "@/components/CharacterCreation/CharacterContext";
import { colors, fonts } from "@/theme";
import type { CSSProperties } from "react";

export default function AbilitiesForm() {
  const { character, updateCharacter } = useCharacter();

  const abilities = character.abilities;
  const remaining = remainingAbilityPoints(abilities);

  const adjust = (key: string, delta: number) => {
    const current = abilities[key as keyof typeof abilities];
    const next = current + delta;
    if (next < ABILITY_BASE || next > MAX_SCORE) return;
    if (delta > 0 && remaining <= 0) return;
    if (delta < 0 && current <= ABILITY_BASE) return;
    updateCharacter("abilities", {
      ...abilities,
      [key]: next,
    });
  };

  return (
    <>
      <div>
        <div
          style={abilitiesFormStyle}
        >
          <span
            style={abilitiesFormStyle2}
          >
            Set Your Abilities
          </span>
          <div style={abilitiesFormStyle3} />
        </div>

        <div
          style={{
            textAlign: "center",
            padding: "14px",
            marginBottom: 16,
            background:
              remaining === 0
                ? "rgba(34,197,94,0.08)"
                : "rgba(212,175,55,0.06)",
            border: `1px solid ${
              remaining === 0
                ? "rgba(34,197,94,0.3)"
                : "rgba(212,175,55,0.2)"
            }`,
            borderRadius: 8,
          }}
        >
          <span
            style={abilitiesFormStyle4}
          >
            Points Remaining
          </span>
          <div
            style={{
              fontSize: 32,
              fontWeight: 700,
              fontFamily: fonts.display,
              color:
                remaining === 0
                  ? colors.success
                  : remaining < 0
                    ? colors.danger
                    : colors.text,
              lineHeight: 1.2,
            }}
          >
            {remaining}
          </div>
        </div>

        <div
          style={abilitiesFormStyle5}
        >
          {ABILITY_KEYS.map((key) => {
            const val = abilities[key];
            const atMin = val <= ABILITY_BASE;
            const atMax = val >= MAX_SCORE;
            const noPoints = remaining <= 0;
            return (
              <div
                key={key}
                className="ability-card"
                style={abilitiesFormStyle6}
              >
                <button
                  className="pt-btn"
                  onClick={() => adjust(key, -1)}
                  disabled={atMin}
                  style={{
                    width: 32,
                    height: 32,
                    flexShrink: 0,
                    background: "rgba(0,0,0,0.3)",
                    border: "1px solid rgba(180,140,80,0.15)",
                    borderRadius: 5,
                    color: atMin ? "#4B5563" : colors.text,
                    fontSize: 16,
                    fontWeight: 700,
                    cursor: atMin ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "background 0.12s",
                    fontFamily: fonts.display,
                  }}
                >
                  −
                </button>
                <div style={{ flex: 1, textAlign: "center" }}>
                  <div
                    style={abilitiesFormStyle7}
                  >
                    {val}
                  </div>
                  <div
                    style={abilitiesFormStyle8}
                  >
                    {key.slice(0, 3)}
                  </div>
                </div>
                <button
                  className="pt-btn"
                  onClick={() => adjust(key, 1)}
                  disabled={atMax || noPoints}
                  style={{
                    width: 32,
                    height: 32,
                    flexShrink: 0,
                    background: "rgba(0,0,0,0.3)",
                    border: "1px solid rgba(180,140,80,0.15)",
                    borderRadius: 5,
                    color: atMax || noPoints ? "#4B5563" : colors.text,
                    fontSize: 16,
                    fontWeight: 700,
                    cursor:
                      atMax || noPoints ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "background 0.12s",
                    fontFamily: fonts.display,
                  }}
                >
                  +
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

// Static style objects hoisted out of the render path.
const abilitiesFormStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  margin: "0 0 18px",
};
const abilitiesFormStyle2: CSSProperties = {
  fontSize: 11,
  color: colors.goldMuted,
  fontFamily: fonts.display,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  fontWeight: 700,
  whiteSpace: "nowrap",
};
const abilitiesFormStyle3: CSSProperties = { flex: 1, height: 1, background: colors.goldBorder };
  const abilitiesFormStyle4: CSSProperties = {
                fontSize: 11,
                color: colors.goldMuted,
                fontFamily: fonts.display,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                fontWeight: 700,
};
const abilitiesFormStyle5: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 8,
};
const abilitiesFormStyle6: CSSProperties = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(180,140,80,0.12)",
  borderRadius: 7,
  padding: "12px 14px",
  display: "flex",
  alignItems: "center",
  gap: 10,
  transition: "border-color 0.12s, background 0.12s",
};
const abilitiesFormStyle7: CSSProperties = {
  fontSize: 22,
  fontWeight: 700,
  color: colors.text,
  fontFamily: fonts.display,
  lineHeight: 1.1,
};
const abilitiesFormStyle8: CSSProperties = {
  fontSize: 9,
  color: colors.textMuted,
  fontFamily: fonts.display,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  marginTop: 2,
};
