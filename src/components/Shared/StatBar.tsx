import { colors } from "@/theme";

export function StatBar({
  value,
  max,
  color,
}: {
  value: number;
  max: number;
  color: string;
}) {
  const pct = Math.min(100, (value / max) * 100);
  const isLow = pct <= 25;
  return (
    <div
      style={{
        height: 4,
        background: "rgba(0,0,0,0.5)",
        borderRadius: 2,
        overflow: "hidden",
        border: `1px solid ${colors.subtleBorder}`,
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${pct}%`,
          background: isLow ? "#EF4444" : color,
          borderRadius: 2,
          transition: "width 0.4s ease",
          boxShadow: isLow ? "0 0 6px rgba(239,68,68,0.5)" : "none",
        }}
      />
    </div>
  );
}

