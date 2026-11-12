import { colors as themeColors, fonts } from "@/theme";

interface ActionBtnProps {
  onClick?: () => void;
  disabled?: boolean;
  variant?: "default" | "danger" | "success" | "muted";
  children: React.ReactNode;
  fullWidth?: boolean;
  title?: string;
}

export function ActionBtn({
  onClick,
  disabled,
  variant = "default",
  children,
  fullWidth,
  title,
}: ActionBtnProps) {
  const colors = {
    default: {
      bg: "rgba(255,255,255,0.04)",
      hover: "rgba(180,140,80,0.12)",
      border: themeColors.goldBorder,
      text: themeColors.goldMuted,
    },
    danger: {
      bg: "rgba(220,38,38,0.07)",
      hover: "rgba(220,38,38,0.14)",
      border: "rgba(220,38,38,0.25)",
      text: "#FCA5A5",
    },
    success: {
      bg: "rgba(5,150,105,0.07)",
      hover: "rgba(5,150,105,0.14)",
      border: "rgba(52,211,153,0.25)",
      text: "#6EE7B7",
    },
    muted: {
      bg: "rgba(0,0,0,0.2)",
      hover: "rgba(0,0,0,0.2)",
      border: themeColors.subtleBorder,
      text: "#4B5563",
    },
  };
  const c = disabled ? colors.muted : colors[variant];

  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        padding: "10px 12px",
        background: c.bg,
        border: `1px solid ${c.border}`,
        borderRadius: 6,
        color: c.text,
        fontSize: 12,
        fontFamily: fonts.display,
        fontWeight: 600,
        letterSpacing: "0.05em",
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "background 0.15s, border-color 0.15s",
        width: fullWidth ? "100%" : undefined,
        opacity: disabled ? 0.5 : 1,
        userSelect: "none",
        font: "inherit",
      }}
      onMouseEnter={(e) => {
        if (!disabled) e.currentTarget.style.background = c.hover;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = c.bg;
      }}
    >
      {children}
    </button>
  );
}
