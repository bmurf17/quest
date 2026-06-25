import { MAX_SCORE, POINT_BUDGET } from "@/consts/constants";
import { useCharacter } from "../CharacterContext";
import { colors, fonts } from "@/theme";

const BASE = 8;
const ABILITY_KEYS = [
  "strength",
  "dexterity",
  "constitution",
  "intelligence",
  "wisdom",
  "charisma",
  "defense",
] as const;

export default function AbilitiesForm() {
  const { character, updateCharacter } = useCharacter();

  const abilities = character.abilities;
  const totalSpent = ABILITY_KEYS.reduce(
    (sum, k) => sum + (abilities[k] - BASE),
    0,
  );
  const remaining = POINT_BUDGET - totalSpent;

  const adjust = (key: string, delta: number) => {
    const current = abilities[key as keyof typeof abilities];
    const next = current + delta;
    if (next < BASE || next > MAX_SCORE) return;
    if (delta > 0 && remaining <= 0) return;
    if (delta < 0 && current <= BASE) return;
    updateCharacter("abilities", {
      ...abilities,
      [key]: next,
    });
  };

  return (
    <>
      <style>{`
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        input[type=number] { -moz-appearance: textfield; }
        .ability-card:hover { border-color: rgba(180,140,80,0.28) !important; background: rgba(255,255,255,0.05) !important; }
        .pt-btn:hover { background: rgba(212,175,55,0.15) !important; }
      `}</style>
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            margin: "0 0 18px",
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
            Set Your Abilities
          </span>
          <div style={{ flex: 1, height: 1, background: colors.goldBorder }} />
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
            style={{
              fontSize: 11,
              color: colors.goldMuted,
              fontFamily: fonts.display,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              fontWeight: 700,
            }}
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
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 8,
          }}
        >
          {ABILITY_KEYS.map((key) => {
            const val = abilities[key];
            const atMin = val <= BASE;
            const atMax = val >= MAX_SCORE;
            const noPoints = remaining <= 0;
            return (
              <div
                key={key}
                className="ability-card"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(180,140,80,0.12)",
                  borderRadius: 7,
                  padding: "12px 14px",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  transition: "border-color 0.12s, background 0.12s",
                }}
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
                    style={{
                      fontSize: 22,
                      fontWeight: 700,
                      color: colors.text,
                      fontFamily: fonts.display,
                      lineHeight: 1.1,
                    }}
                  >
                    {val}
                  </div>
                  <div
                    style={{
                      fontSize: 9,
                      color: colors.textMuted,
                      fontFamily: fonts.display,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      marginTop: 2,
                    }}
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
