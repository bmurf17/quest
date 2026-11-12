import { colors, fonts } from "@/theme";

export const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "rgba(0,0,0,0.4)",
  border: `1px solid ${colors.goldBorder}`,
  borderRadius: 6,
  padding: "9px 12px",
  color: colors.text,
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
  fontFamily: fonts.body,
  transition: "border-color 0.2s",
};
