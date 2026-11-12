import { useEffect, useRef } from "react";

import { colors, fonts } from "@/theme";
import type { CSSProperties } from "react";

interface Props {
  activityLog: string[];
}

const classifyLog = (log: string): { color: string; prefix: string } => {
  const l = log.toLowerCase();
  if (
    l.includes("defeated") ||
    l.includes("died") ||
    l.includes("slain") ||
    l.includes("dead")
  )
    return { color: "#FCA5A5", prefix: "✦" };
  if (
    l.includes("damage") ||
    l.includes("hit") ||
    l.includes("attack") ||
    l.includes("strike")
  )
    return { color: "#F87171", prefix: "⚔" };
  if (
    l.includes("heal") ||
    l.includes("restore") ||
    l.includes("recover") ||
    l.includes("hp")
  )
    return { color: "#6EE7B7", prefix: "✚" };
  if (
    l.includes("mana") ||
    l.includes("mp") ||
    l.includes("spell") ||
    l.includes("cast") ||
    l.includes("magic")
  )
    return { color: "#818CF8", prefix: "✦" };
  if (
    l.includes("found") ||
    l.includes("chest") ||
    l.includes("item") ||
    l.includes("loot") ||
    l.includes("gold")
  )
    return { color: "#FCD34D", prefix: "◈" };
  if (
    l.includes("enter") ||
    l.includes("room") ||
    l.includes("arrived") ||
    l.includes("discover")
  )
    return { color: colors.goldMuted, prefix: "▸" };
  if (l.includes("miss") || l.includes("evad") || l.includes("dodge"))
    return { color: colors.muted, prefix: "◌" };
  return { color: colors.textMuted, prefix: "·" };
};

export default function ActivityLog({ activityLog }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activityLog]);

  return (
    <>

      <div
        style={activityLogStyle}
      >
        <div
          style={activityLogStyle2}
        >
          <span
            style={activityLogStyle3}
          >
            Chronicle
          </span>
          <span
            style={activityLogStyle4}
          >
            {activityLog.length} entries
          </span>
        </div>

        <div
          ref={containerRef}
          className="log-scroll"
          style={activityLogStyle5}
        >
          {activityLog.length === 0 ? (
            <div
              style={activityLogStyle6}
            >
              The chronicle awaits your deeds…
            </div>
          ) : (
            activityLog.map((log, i) => {
              const { color, prefix } = classifyLog(log);
              const isRecent = i === activityLog.length - 1;
              return (
                <div
                  key={i}
                  className="log-line"
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: 8,
                    padding: "4px 8px",
                    borderRadius: 4,
                    background: isRecent
                      ? "rgba(180,140,80,0.06)"
                      : "transparent",
                    marginBottom: 1,
                  }}
                >
                  <span
                    style={activityLogStyle7}
                  >
                    {i + 1}
                  </span>

                  <span
                    style={{
                      fontSize: 10,
                      color,
                      flexShrink: 0,
                      opacity: 0.8,
                      userSelect: "none",
                      lineHeight: 1.6,
                    }}
                  >
                    {prefix}
                  </span>

                  <span
                    style={{
                      fontSize: 13,
                      color: isRecent ? colors.text : colors.textMuted,
                      fontFamily: fonts.body,
                      lineHeight: 1.5,
                      flex: 1,
                    }}
                  >
                    {log}
                  </span>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>
      </div>
    </>
  );
}

// Static style objects hoisted out of the render path.
const activityLogStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  background: "rgba(0,0,0,0.35)",
  border: `1px solid ${colors.goldBorder}`,
  borderRadius: 8,
  overflow: "hidden",
};
const activityLogStyle2: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "8px 12px",
  borderBottom: "1px solid rgba(180,140,80,0.12)",
  flexShrink: 0,
};
const activityLogStyle3: CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  color: colors.goldMuted,
  fontFamily: fonts.display,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
};
const activityLogStyle4: CSSProperties = {
  fontSize: 10,
  color: colors.muted,
  fontFamily: fonts.body,
};
const activityLogStyle5: CSSProperties = {
  flex: 1,
  overflowY: "auto",
  padding: "6px 4px",
};
const activityLogStyle6: CSSProperties = {
  padding: "20px 12px",
  textAlign: "center",
  color: colors.muted,
  fontSize: 12,
  fontFamily: fonts.body,
  fontStyle: "italic",
};
const activityLogStyle7: CSSProperties = {
  fontSize: 9,
  color: colors.textMuted,
  fontFamily: fonts.body,
  minWidth: 22,
  textAlign: "right",
  flexShrink: 0,
  userSelect: "none",
};
