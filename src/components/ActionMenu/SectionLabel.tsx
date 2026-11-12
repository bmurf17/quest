import { colors as themeColors, fonts } from "@/theme";
import type { CSSProperties } from "react";

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={sectionLabelStyle}>
      <span
        style={{
          fontSize: 9,
          color: themeColors.goldMuted,
          fontFamily: fonts.display,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
        }}
      >
        {children}
      </span>
      <div style={{ flex: 1, height: 1, background: themeColors.goldBorder }} />
    </div>
  );
}

// Static style objects hoisted out of the render path.
const sectionLabelStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  marginBottom: 6,
};
