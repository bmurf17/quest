import { colors, fonts } from "@/theme";
import type { CSSProperties, ReactNode } from "react";

interface AdminPageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}

/** Consistent page heading used across the admin console. */
export function AdminPageHeader({
  eyebrow = "Game Design",
  title,
  description,
  actions,
}: AdminPageHeaderProps) {
  return (
    <header style={headerStyle}>
      <div style={{ minWidth: 0 }}>
        <div style={eyebrowStyle}>{eyebrow}</div>
        <h1 style={titleStyle}>{title}</h1>
        {description && <p style={subtitleStyle}>{description}</p>}
      </div>
      {actions && <div style={actionsStyle}>{actions}</div>}
    </header>
  );
}

const headerStyle: CSSProperties = {
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "space-between",
  gap: 16,
  flexWrap: "wrap",
  marginBottom: 24,
};
const eyebrowStyle: CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: colors.goldMuted,
  fontFamily: fonts.display,
  marginBottom: 6,
};
const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: 30,
  fontWeight: 700,
  color: colors.text,
  fontFamily: fonts.display,
  letterSpacing: "0.04em",
};
const subtitleStyle: CSSProperties = { margin: "6px 0 0", fontSize: 14, color: colors.muted };
const actionsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  flexWrap: "wrap",
};
