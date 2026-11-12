import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { colors, fonts } from "@/theme";
import type { CSSProperties } from "react";


export function QuestPanelHeader({
  title,
  onBack,
}: {
  title: string;
  onBack?: () => void;
}) {
  return (
    <DialogHeader
      style={{
        padding: "18px 22px 14px",
        borderBottom: "1px solid rgba(180,140,80,0.12)",
      }}
      className="space-y-0"
    >
      <div
        style={questPanelHeaderStyle}
      >
        {onBack && (
          <button
            onClick={onBack}
            aria-label="Back to quest list"
            style={questPanelHeaderStyle2}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(180,140,80,0.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.03)";
            }}
          >
            ←
          </button>
        )}
        <DialogTitle
          style={questPanelHeaderStyle3}
        >
          {title}
        </DialogTitle>
      </div>
    </DialogHeader>
  );
}

export function QuestSectionBox({
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...rest}
      style={{
        padding: "10px 12px",
        background: "rgba(255,255,255,0.025)",
        border: "1px solid rgba(180,140,80,0.14)",
        borderRadius: 7,
        ...rest.style,
      }}
    >
      {children}
    </div>
  );
}

export function QuestSectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={questSectionLabelStyle}
    >
      {children}
    </div>
  );
}

// Static style objects hoisted out of the render path.
const questPanelHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
};
const questPanelHeaderStyle2: CSSProperties = {
  flexShrink: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: 26,
  height: 26,
  background: "rgba(255,255,255,0.03)",
  border: `1px solid ${colors.goldBorder}`,
  borderRadius: 6,
  color: colors.goldMuted,
  cursor: "pointer",
  fontSize: 13,
  lineHeight: 1,
  padding: 0,
};
const questPanelHeaderStyle3: CSSProperties = {
  margin: 0,
  fontSize: 16,
  fontWeight: 700,
  color: colors.goldMuted,
  fontFamily: fonts.display,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
};
const questSectionLabelStyle: CSSProperties = {
  fontSize: 11,
  color: colors.textMuted,
  fontFamily: fonts.display,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  marginBottom: 6,
};
