import { useCharacter } from "@/components/CharacterCreation/CharacterContext";
import { colors, fonts } from "@/theme";
import type { CSSProperties } from "react";

export default function NameForm() {
  const { character, updateCharacter } = useCharacter();

  return (
    <div>
      <div
        style={nameFormStyle}
      >
        <span
          style={nameFormStyle2}
        >
          Name Your Character
        </span>
        <div style={nameFormStyle3} />
      </div>
      <input
        type="text"
        value={character.name}
        onChange={(e) => updateCharacter("name", e.target.value)}
        placeholder="Enter character name..."
        maxLength={30}
        style={nameFormStyle4}
      />
    </div>
  );
}

// Static style objects hoisted out of the render path.
const nameFormStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  margin: "0 0 18px",
};
const nameFormStyle2: CSSProperties = {
  fontSize: 11,
  color: colors.goldMuted,
  fontFamily: fonts.display,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  fontWeight: 700,
  whiteSpace: "nowrap",
};
const nameFormStyle3: CSSProperties = { flex: 1, height: 1, background: colors.goldBorder };
  const nameFormStyle4: CSSProperties = {
            width: "100%",
            padding: "14px 16px",
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(180,140,80,0.2)",
            borderRadius: 7,
            color: colors.text,
            fontFamily: fonts.display,
            fontSize: 18,
            fontWeight: 700,
            outline: "none",
            boxSizing: "border-box",
};
