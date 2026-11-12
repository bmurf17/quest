import { colors, fonts } from "@/theme";

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
        style={{
          fontSize: 11,
          color: colors.goldMuted,
          fontFamily: fonts.display,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          fontWeight: 700,
          whiteSpace: "nowrap",
        }}
      >
        {children}
      </span>
      <div style={{ flex: 1, height: 1, background: colors.goldBorder }} />
    </div>
  );
}
