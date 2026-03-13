import { useEffect, useRef } from "react";

interface Props {
  activityLog: string[];
}

const classifyLog = (log: string): { color: string; prefix: string } => {
  const l = log.toLowerCase();
  if (l.includes("defeated") || l.includes("died") || l.includes("slain") || l.includes("dead"))
    return { color: "#FCA5A5", prefix: "✦" };
  if (l.includes("damage") || l.includes("hit") || l.includes("attack") || l.includes("strike"))
    return { color: "#F87171", prefix: "⚔" };
  if (l.includes("heal") || l.includes("restore") || l.includes("recover") || l.includes("hp"))
    return { color: "#6EE7B7", prefix: "✚" };
  if (l.includes("mana") || l.includes("mp") || l.includes("spell") || l.includes("cast") || l.includes("magic"))
    return { color: "#818CF8", prefix: "✦" };
  if (l.includes("found") || l.includes("chest") || l.includes("item") || l.includes("loot") || l.includes("gold"))
    return { color: "#FCD34D", prefix: "◈" };
  if (l.includes("enter") || l.includes("room") || l.includes("arrived") || l.includes("discover"))
    return { color: "#C9A84C", prefix: "▸" };
  if (l.includes("miss") || l.includes("evad") || l.includes("dodge"))
    return { color: "#9CA3AF", prefix: "◌" };
  return { color: "#A8916A", prefix: "·" };
};

export default function ActivityLog({ activityLog }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activityLog]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@600&family=Lato:wght@400&display=swap');
        .log-line { transition: background 0.1s; }
        .log-line:hover { background: rgba(180,140,80,0.05) !important; }
        .log-scroll::-webkit-scrollbar { width: 3px; }
        .log-scroll::-webkit-scrollbar-track { background: transparent; }
        .log-scroll::-webkit-scrollbar-thumb { background: rgba(180,140,80,0.2); border-radius: 2px; }
      `}</style>

      <div style={{
        display: "flex",
        flexDirection: "column",
        background: "rgba(0,0,0,0.35)",
        border: "1px solid rgba(180,140,80,0.15)",
        borderRadius: 8,
        overflow: "hidden",
      }}>

        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 12px",
          borderBottom: "1px solid rgba(180,140,80,0.12)",
          flexShrink: 0,
        }}>
          <span style={{
            fontSize: 10,
            fontWeight: 700,
            color: "#C9A84C",
            fontFamily: "'Cinzel', Georgia, serif",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}>
            Chronicle
          </span>
          <span style={{
            fontSize: 10,
            color: "#4B5563",
            fontFamily: "'Lato', sans-serif",
          }}>
            {activityLog.length} entries
          </span>
        </div>

        <div
          ref={containerRef}
          className="log-scroll"
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "6px 4px",
          }}
        >
          {activityLog.length === 0 ? (
            <div style={{
              padding: "20px 12px",
              textAlign: "center",
              color: "#374151",
              fontSize: 12,
              fontFamily: "'Lato', sans-serif",
              fontStyle: "italic",
            }}>
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
                    background: isRecent ? "rgba(180,140,80,0.06)" : "transparent",
                    marginBottom: 1,
                  }}
                >
                  <span style={{
                    fontSize: 9,
                    color: "#3A3228",
                    fontFamily: "'Lato', sans-serif",
                    minWidth: 22,
                    textAlign: "right",
                    flexShrink: 0,
                    userSelect: "none",
                  }}>
                    {i + 1}
                  </span>

                  <span style={{
                    fontSize: 10,
                    color,
                    flexShrink: 0,
                    opacity: 0.8,
                    userSelect: "none",
                    lineHeight: 1.6,
                  }}>
                    {prefix}
                  </span>

                  <span style={{
                    fontSize: 13,
                    color: isRecent ? "#E8DCC8" : "#9A8A72",
                    fontFamily: "'Lato', sans-serif",
                    lineHeight: 1.5,
                    flex: 1,
                  }}>
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