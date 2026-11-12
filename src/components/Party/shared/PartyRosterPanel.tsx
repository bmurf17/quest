import type { CharacterData } from "@/types/Character";
import { useGameStore } from "@/state/GameState";
import { colors, fonts } from "@/theme";
import { Link } from "react-router-dom";
import { PartyRosterCard } from "./PartyRosterCard";

const MAX_PARTY_SIZE = 6;

export function PartyRosterPanel({
  party,
  onRemove,
  emptyTitle,
  emptyHint,
}: {
  party: CharacterData[];
  onRemove: (index: number) => void;
  emptyTitle: string;
  emptyHint?: string;
}) {
  const enterCombat = useGameStore((state) => state.enterCombat);

  return (
    <div
      style={{
        width: 320,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        background: "rgba(0,0,0,0.2)",
      }}
    >
      <div
        style={{
          padding: "20px 18px 14px",
          borderBottom: `1px solid ${colors.goldBorder}`,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: 11,
              fontWeight: 700,
              color: colors.goldMuted,
              fontFamily: fonts.display,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            Your Party
          </h2>
          <span
            style={{
              fontSize: 12,
              color:
                party.length === MAX_PARTY_SIZE ? colors.gold : colors.muted,
              fontFamily: fonts.display,
              background:
                party.length === MAX_PARTY_SIZE
                  ? "rgba(212,175,55,0.1)"
                  : "rgba(255,255,255,0.04)",
              border: `1px solid ${party.length === MAX_PARTY_SIZE ? "rgba(212,175,55,0.3)" : "rgba(255,255,255,0.08)"}`,
              borderRadius: 10,
              padding: "2px 8px",
            }}
          >
            {party.length}/{MAX_PARTY_SIZE}
          </span>
        </div>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "10px 12px",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        {party.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 16px" }}>
            <p
              style={{
                margin: "0 0 6px",
                color: "#4B5563",
                fontSize: 13,
                fontFamily: fonts.display,
              }}
            >
              {emptyTitle}
            </p>
            {emptyHint && (
              <p style={{ margin: 0, color: "#374151", fontSize: 13 }}>
                {emptyHint}
              </p>
            )}
          </div>
        ) : (
          party.map((member, index) => (
            <PartyRosterCard
              key={index}
              member={member}
              onRemove={() => onRemove(index)}
            />
          ))
        )}
      </div>

      {party.length > 0 && (
        <div
          style={{
            padding: "12px",
            borderTop: `1px solid ${colors.goldBorder}`,
            flexShrink: 0,
          }}
        >
          <Link to="/game" style={{ textDecoration: "none" }}>
            <button
              onClick={enterCombat}
              style={{
                width: "100%",
                padding: "14px",
                background: `linear-gradient(135deg, ${colors.gold} 0%, ${colors.gold} 50%, ${colors.gold} 100%)`,
                border: "none",
                borderRadius: 8,
                color: "#0d0b07",
                fontSize: 13,
                fontWeight: 700,
                fontFamily: fonts.display,
                letterSpacing: "0.06em",
                cursor: "pointer",
                transition: "filter 0.15s, transform 0.1s",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.filter = "brightness(1.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.filter = "none";
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = "scale(0.98)";
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                width={15}
                height={15}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                />
              </svg>
              Begin Adventure
            </button>
          </Link>
        </div>
      )}
    </div>
  );
}
