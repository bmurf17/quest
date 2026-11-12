import { colors as themeColors, fonts } from "@/theme";
import type { CSSProperties } from "react";

interface AbilitySlotProps {
  img: string;
  alt: string;
  badge?: string | number;
  badgeColor?: string;
  disabled?: boolean;
  onClick: () => void;
  title?: string;
}

export function AbilitySlot({
  img,
  alt,
  badge,
  badgeColor = "#6366F1",
  disabled,
  onClick,
  title,
}: AbilitySlotProps) {
  return (
    <div
      title={title}
      onClick={!disabled ? onClick : undefined}
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        aspectRatio: "1",
        background: disabled ? "rgba(0,0,0,0.3)" : "rgba(255,255,255,0.04)",
        border: `1px solid ${disabled ? themeColors.subtleBorder : themeColors.goldBorder}`,
        borderRadius: 7,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.4 : 1,
        transition: "background 0.15s, border-color 0.15s, transform 0.1s",
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.background = "rgba(180,140,80,0.1)";
          e.currentTarget.style.borderColor = themeColors.gold;
          e.currentTarget.style.transform = "scale(1.04)";
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = disabled
          ? "rgba(0,0,0,0.3)"
          : "rgba(255,255,255,0.04)";
        e.currentTarget.style.borderColor = disabled
          ? themeColors.subtleBorder
          : themeColors.goldBorder;
        e.currentTarget.style.transform = "scale(1)";
      }}
    >
      <img
        src={img}
        alt={alt}
        style={abilitySlotStyle}
      />
      {badge !== undefined && (
        <div
          style={{
            position: "absolute",
            bottom: 3,
            right: 3,
            background: badgeColor,
            color: "#fff",
            fontSize: 9,
            fontFamily: fonts.body,
            padding: "1px 4px",
            borderRadius: 3,
            lineHeight: 1.4,
          }}
        >
          {badge}
        </div>
      )}
    </div>
  );
}

// Static style objects hoisted out of the render path.
const abilitySlotStyle: CSSProperties = {
  width: "60%",
  height: "60%",
  imageRendering: "pixelated",
  filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.6))",
};
