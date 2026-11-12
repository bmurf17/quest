import type { CSSProperties } from "react";
import { colors } from "@/theme";

export interface StatBarProps {
  value: number;
  max: number;
  color: string;
  /** Track height in pixels. Defaults to 4. */
  height?: number;
  /** Border radius for the track and fill. Defaults to 2. */
  radius?: number;
  /** Background of the track. Defaults to a dark translucent black. */
  trackColor?: string;
  /** Border around the track. Pass `false` to omit it. */
  border?: string | false;
  /** Percentage at or below which the bar turns red. Pass `0` to disable. */
  lowThreshold?: number;
  /** Colour used when the value is low. Defaults to danger red. */
  lowColor?: string;
  /** CSS transition for the fill width. Defaults to `width 0.4s ease`. */
  transition?: string;
  /** Whether to add a glow when the value is low. Defaults to true. */
  glowWhenLow?: boolean;
  className?: string;
  style?: CSSProperties;
}

export function StatBar({
  value,
  max,
  color,
  height = 4,
  radius = 2,
  trackColor = "rgba(0,0,0,0.5)",
  border = `1px solid ${colors.subtleBorder}`,
  lowThreshold = 25,
  lowColor = colors.danger,
  transition = "width 0.4s ease",
  glowWhenLow = true,
  className,
  style,
}: StatBarProps) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const isLow = lowThreshold > 0 && pct <= lowThreshold;

  return (
    <div
      className={className}
      style={{
        height,
        background: trackColor,
        borderRadius: radius,
        overflow: "hidden",
        border: border === false ? undefined : border,
        ...style,
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${pct}%`,
          background: isLow ? lowColor : color,
          borderRadius: radius,
          transition,
          boxShadow: isLow && glowWhenLow ? "0 0 6px rgba(239,68,68,0.5)" : "none",
        }}
      />
    </div>
  );
}
