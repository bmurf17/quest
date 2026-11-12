import { useCharacter } from "@/components/CharacterCreation/CharacterContext";
import { colors, fonts } from "@/theme";
import type { CSSProperties } from "react";

const CLASSES = ["Barbarian", "Bard", "Cleric", "Druid", "Fighter"];

export default function ClassForm() {
  const { character, updateCharacter } = useCharacter();

  return (
    <>
      <div>
        <div
          style={classFormStyle}
        >
          <span
            style={classFormStyle2}
          >
            Choose Your Class
          </span>
          <div style={classFormStyle3} />
        </div>
        <div
          style={classFormStyle4}
        >
          {CLASSES.map((cls) => {
            const active = character.class === cls.toLowerCase();
            return (
              <button
                type="button"
                key={cls}
                className="class-card"
                onClick={() => updateCharacter("class", cls.toLowerCase())}
                aria-pressed={active}
                style={{
                  font: "inherit",
                  textAlign: "left",
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 14px",
                  borderRadius: 7,
                  border: `1px solid ${active ? "rgba(212,175,55,0.4)" : "rgba(180,140,80,0.12)"}`,
                  background: active
                    ? "rgba(212,175,55,0.09)"
                    : "rgba(255,255,255,0.03)",
                  cursor: "pointer",
                  transition: "background 0.12s, border-color 0.12s",
                }}
              >
                <div
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: "50%",
                    border: `2px solid ${active ? colors.gold : "rgba(180,140,80,0.3)"}`,
                    background: active ? colors.gold : "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    transition: "all 0.12s",
                  }}
                >
                  {active && (
                    <div
                      style={classFormStyle5}
                    />
                  )}
                </div>
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: active ? colors.text : colors.textMuted,
                    fontFamily: fonts.display,
                  }}
                >
                  {cls}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}

// Static style objects hoisted out of the render path.
const classFormStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  margin: "0 0 18px",
};
const classFormStyle2: CSSProperties = {
  fontSize: 11,
  color: colors.goldMuted,
  fontFamily: fonts.display,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  fontWeight: 700,
  whiteSpace: "nowrap",
};
const classFormStyle3: CSSProperties = { flex: 1, height: 1, background: colors.goldBorder };
  const classFormStyle4: CSSProperties = {
              display: "flex",
              flexDirection: "column",
              gap: 6,
};
const classFormStyle5: CSSProperties = {
  width: 6,
  height: 6,
  borderRadius: "50%",
  background: "#0d0b07",
};
