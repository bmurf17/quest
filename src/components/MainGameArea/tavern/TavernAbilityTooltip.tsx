import type { CharacterData } from "@/types/Character";
import { colors, fonts } from "@/theme";

export function TavernAbilityTooltip({
  character,
}: {
  character: CharacterData;
}) {
  return (
    <div
      style={{
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
      }}
    >
      {Object.entries(character.abilities).map(([key, ability]) => (
        <div
          key={key}
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 10,
          }}
        >
          <span
            style={{
              fontSize: 9,
              color: colors.textMuted,
              fontFamily: fonts.display,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            {key}
          </span>
          <span
            style={{
              fontSize: 9,
              fontWeight: 700,
              color: colors.text,
              fontFamily: fonts.body,
            }}
          >
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
