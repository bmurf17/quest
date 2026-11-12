import { useCharacter } from "@/components/CharacterCreation/CharacterContext";
import { colors, fonts } from "@/theme";
import type { CSSProperties } from "react";

const SUBRACES: Record<string, string[]> = {
  human: ["Standard", "Variant"],
  elf: ["High Elf", "Wood Elf", "Dark Elf"],
  dwarf: ["Hill Dwarf", "Mountain Dwarf"],
  halfling: ["Lightfoot", "Stout"],
  dragonborn: [
    "Black", "Blue", "Brass", "Bronze", "Copper",
    "Gold", "Green", "Red", "Silver", "White",
  ],
};

export default function SubraceForm() {
  const { character, updateCharacter } = useCharacter();

  return (
    <>
      <div>
        <div
          style={subraceFormStyle}
        >
          <span
            style={subraceFormStyle2}
          >
            Choose Your Subrace
          </span>
          <div style={subraceFormStyle3} />
        </div>
        {character.race ? (
          <div
            style={subraceFormStyle4}
          >
            {(SUBRACES[character.race] || []).map((subrace) => {
              const id = subrace.toLowerCase().replace(" ", "-");
              const active = character.subrace === id;
              return (
                <div
                  key={subrace}
                  className="subrace-card"
                  onClick={() => updateCharacter("subrace", id)}
                  style={{
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
                        style={subraceFormStyle5}
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
                    {subrace}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <p
            style={subraceFormStyle6}
          >
            Please select a race first.
          </p>
        )}
      </div>
    </>
  );
}

// Static style objects hoisted out of the render path.
const subraceFormStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  margin: "0 0 18px",
};
const subraceFormStyle2: CSSProperties = {
  fontSize: 11,
  color: colors.goldMuted,
  fontFamily: fonts.display,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  fontWeight: 700,
  whiteSpace: "nowrap",
};
const subraceFormStyle3: CSSProperties = { flex: 1, height: 1, background: colors.goldBorder };
  const subraceFormStyle4: CSSProperties = {
                display: "flex",
                flexDirection: "column",
                gap: 6,
};
const subraceFormStyle5: CSSProperties = {
  width: 6,
  height: 6,
  borderRadius: "50%",
  background: "#0d0b07",
};
const subraceFormStyle6: CSSProperties = {
  color: "#4B5563",
  fontSize: 13,
  fontFamily: fonts.body,
  margin: 0,
};
