import { colors, fonts } from "@/theme";
import type { CSSProperties } from "react";

export const adminPageStyle: CSSProperties = {
  minHeight: "100%",
  padding: "36px 28px 72px",
  fontFamily: fonts.body,
};

export const adminPanelStyle: CSSProperties = {
  background: "rgba(255,255,255,0.025)",
  border: `1px solid ${colors.goldBorder}`,
  borderRadius: 10,
  padding: 20,
  minWidth: 0,
};

export const adminSectionHeadingStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: colors.gold,
  fontFamily: fonts.display,
  marginBottom: 14,
};

export const adminPrimaryButtonStyle: CSSProperties = {
  display: "inline-block",
  padding: "9px 18px",
  background: "rgba(212,175,55,0.16)",
  border: `1px solid ${colors.goldBorder}`,
  borderRadius: 6,
  color: colors.gold,
  fontSize: 12,
  fontWeight: 700,
  fontFamily: fonts.display,
  letterSpacing: "0.05em",
  textDecoration: "none",
  cursor: "pointer",
};

export const adminSecondaryButtonStyle: CSSProperties = {
  display: "inline-block",
  padding: "9px 18px",
  background: "rgba(255,255,255,0.03)",
  border: `1px solid ${colors.subtleBorder}`,
  borderRadius: 6,
  color: colors.textMuted,
  fontSize: 12,
  fontWeight: 700,
  fontFamily: fonts.display,
  letterSpacing: "0.05em",
  textDecoration: "none",
  cursor: "pointer",
};
