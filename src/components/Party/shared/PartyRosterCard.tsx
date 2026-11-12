import type { CharacterData } from "@/types/Character";
import { colors, fonts } from "@/theme";
import { StatBar } from "@/components/shared/StatBar";

export function PartyRosterCard({
  member,
  onRemove,
}: {
  member: CharacterData;
  onRemove: () => void;
}) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(180,140,80,0.14)",
        borderRadius: 8,
      }}
    >
      <div
        style={{
          padding: "9px 12px",
          borderBottom: "1px solid rgba(180,140,80,0.09)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: colors.text,
              fontFamily: fonts.display,
            }}
          >
            {member.name}
          </div>
          <div style={{ fontSize: 11, color: "#7A6A52", marginTop: 1 }}>
            {member.class} · Lv {member.level}
          </div>
        </div>
        <button
          className="remove-btn"
          onClick={onRemove}
          style={{
            background: "rgba(220,38,38,0.1)",
            border: "1px solid rgba(220,38,38,0.2)",
            borderRadius: 4,
            color: "#FCA5A5",
            fontSize: 11,
            padding: "4px 10px",
            cursor: "pointer",
            transition: "background 0.12s",
            fontFamily: fonts.body,
          }}
        >
          Remove
        </button>
      </div>
      <div
        style={{
          padding: "12px",
          display: "flex",
          gap: 12,
          alignItems: "flex-start",
        }}
      >
        <img
          src={member.img || "/placeholder.svg"}
          alt={member.name}
          style={{
            width: 72,
            height: 72,
            imageRendering: "pixelated",
            filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.6))",
            flexShrink: 0,
          }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 4,
            }}
          >
            <span
              style={{
                fontSize: 11,
                color: colors.danger,
                fontFamily: fonts.display,
                fontWeight: 700,
                letterSpacing: "0.06em",
              }}
            >
              HP
            </span>
            <span style={{ fontSize: 12, color: colors.textMuted }}>
              {member.hp}/{member.maxHp}
            </span>
          </div>
          <StatBar value={member.hp} max={member.maxHp} color="#EF4444" />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 8,
              marginBottom: 4,
            }}
          >
            <span
              style={{
                fontSize: 11,
                color: "#6366F1",
                fontFamily: fonts.display,
                fontWeight: 700,
                letterSpacing: "0.06em",
              }}
            >
              MP
            </span>
            <span style={{ fontSize: 12, color: colors.textMuted }}>
              {member.mp}/{member.maxMp}
            </span>
          </div>
          <StatBar value={member.mp} max={member.maxMp} color="#6366F1" />
          <div
            style={{
              display: "flex",
              gap: 6,
              marginTop: 10,
              flexWrap: "wrap",
            }}
          >
            {Object.entries(member.abilities)
              .slice(0, 4)
              .map(([key, ability]) => (
                <div
                  key={key}
                  style={{
                    textAlign: "center",
                    background: "rgba(0,0,0,0.25)",
                    borderRadius: 4,
                    padding: "4px 7px",
                    minWidth: 34,
                  }}
                >
                  <div
                    style={{
                      fontSize: 9,
                      color: "#7A6A52",
                      fontFamily: fonts.display,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                    }}
                  >
                    {key}
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: "#D4C8B0",
                      fontFamily: fonts.display,
                    }}
                  >
                    {ability.score}
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
