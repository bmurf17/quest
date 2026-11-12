import { colors, fonts } from "@/theme";
import type { CSSProperties } from "react";

export function SectionHeader({
  children,
  margin = "22px 0 10px",
}: {
  children: React.ReactNode;
  margin?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        margin,
      }}
    >
      <span
        style={sectionHeaderStyle}
      >
        {children}
      </span>
      <div style={sectionHeaderStyle2} />
    </div>
  );
}

// Static style objects hoisted out of the render path.
const sectionHeaderStyle: CSSProperties = {
  fontSize: 11,
  color: colors.goldMuted,
  fontFamily: fonts.display,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  fontWeight: 700,
  whiteSpace: "nowrap",
};
const sectionHeaderStyle2: CSSProperties = { flex: 1, height: 1, background: colors.goldBorder };
