import type { CharacterData } from "@/types/Character";
import { colors, fonts } from "@/theme";
import type { CSSProperties } from "react";

export function TavernAbilityTooltip({ character }: { character: CharacterData }) {
  return (
    <div style={tavernAbilityTooltipStyle}>
      {Object.entries(character.abilities).map(([key, ability]) => (
        <div key={key} style={tavernAbilityTooltipStyle2}>
          <span style={tavernAbilityTooltipStyle3}>{key}</span>
          <span style={tavernAbilityTooltipStyle4}>
            {ability.score}
            <span
              style={{
                color: ability.modifier >= 0 ? colors.success : colors.danger,
                marginLeft: 2,
              }}
            >
              {ability.modifier >= 0 ? "+" : ""}
              {ability.modifier}
            </span>
          </span>
        </div>
      ))}
    </div>
  );
}

// Static style objects hoisted out of the render path.
const tavernAbilityTooltipStyle: CSSProperties = {
  position: "absolute",
  top: 8,
  right: 8,
  display: "flex",
  flexDirection: "column",
  gap: 3,
  background: "rgba(0,0,0,0.85)",
  border: `1px solid ${colors.goldBorder}`,
  borderRadius: 6,
  padding: "8px 10px",
  minWidth: 100,
  zIndex: 30,
  pointerEvents: "none",
};
const tavernAbilityTooltipStyle2: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 10,
};
const tavernAbilityTooltipStyle3: CSSProperties = {
  fontSize: 9,
  color: colors.textMuted,
  fontFamily: fonts.display,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
};
const tavernAbilityTooltipStyle4: CSSProperties = {
  fontSize: 9,
  fontWeight: 700,
  color: colors.text,
  fontFamily: fonts.body,
};
