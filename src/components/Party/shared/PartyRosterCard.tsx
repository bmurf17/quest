import type { CharacterData } from "@/types/Character";
import { colors, fonts } from "@/theme";
import { StatBar } from "@/components/shared/StatBar";
import type { CSSProperties } from "react";

export function PartyRosterCard({
  member,
  onRemove,
}: {
  member: CharacterData;
  onRemove: () => void;
}) {
  return (
    <div style={partyRosterCardStyle}>
      <div style={partyRosterCardStyle2}>
        <div>
          <div style={partyRosterCardStyle3}>{member.name}</div>
          <div style={partyRosterCardStyle4}>
            {member.class} · Lv {member.level}
          </div>
        </div>
        <button className="remove-btn" onClick={onRemove} style={partyRosterCardStyle5}>
          Remove
        </button>
      </div>
      <div style={partyRosterCardStyle6}>
        <img
          src={member.img || "/placeholder.svg"}
          alt={member.name}
          style={partyRosterCardStyle7}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={partyRosterCardStyle8}>
            <span style={partyRosterCardStyle9}>HP</span>
            <span style={{ fontSize: 12, color: colors.textMuted }}>
              {member.hp}/{member.maxHp}
            </span>
          </div>
          <StatBar value={member.hp} max={member.maxHp} color={colors.danger} />
          <div style={partyRosterCardStyle10}>
            <span style={partyRosterCardStyle11}>MP</span>
            <span style={{ fontSize: 12, color: colors.textMuted }}>
              {member.mp}/{member.maxMp}
            </span>
          </div>
          <StatBar value={member.mp} max={member.maxMp} color="#6366F1" />
          <div style={partyRosterCardStyle12}>
            {Object.entries(member.abilities)
              .slice(0, 4)
              .map(([key, ability]) => (
                <div key={key} style={partyRosterCardStyle13}>
                  <div style={partyRosterCardStyle14}>{key}</div>
                  <div style={partyRosterCardStyle15}>{ability.score}</div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Static style objects hoisted out of the render path.
const partyRosterCardStyle: CSSProperties = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(180,140,80,0.14)",
  borderRadius: 8,
};
const partyRosterCardStyle2: CSSProperties = {
  padding: "9px 12px",
  borderBottom: "1px solid rgba(180,140,80,0.09)",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
};
const partyRosterCardStyle3: CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  color: colors.text,
  fontFamily: fonts.display,
};
const partyRosterCardStyle4: CSSProperties = { fontSize: 11, color: "#7A6A52", marginTop: 1 };
const partyRosterCardStyle5: CSSProperties = {
  background: "rgba(220,38,38,0.1)",
  border: "1px solid rgba(220,38,38,0.2)",
  borderRadius: 4,
  color: "#FCA5A5",
  fontSize: 11,
  padding: "4px 10px",
  cursor: "pointer",
  transition: "background 0.12s",
  fontFamily: fonts.body,
};
const partyRosterCardStyle6: CSSProperties = {
  padding: "12px",
  display: "flex",
  gap: 12,
  alignItems: "flex-start",
};
const partyRosterCardStyle7: CSSProperties = {
  width: 72,
  height: 72,
  imageRendering: "pixelated",
  filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.6))",
  flexShrink: 0,
};
const partyRosterCardStyle8: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  marginBottom: 4,
};
const partyRosterCardStyle9: CSSProperties = {
  fontSize: 11,
  color: colors.danger,
  fontFamily: fonts.display,
  fontWeight: 700,
  letterSpacing: "0.06em",
};
const partyRosterCardStyle10: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  marginTop: 8,
  marginBottom: 4,
};
const partyRosterCardStyle11: CSSProperties = {
  fontSize: 11,
  color: "#6366F1",
  fontFamily: fonts.display,
  fontWeight: 700,
  letterSpacing: "0.06em",
};
const partyRosterCardStyle12: CSSProperties = {
  display: "flex",
  gap: 6,
  marginTop: 10,
  flexWrap: "wrap",
};
const partyRosterCardStyle13: CSSProperties = {
  textAlign: "center",
  background: "rgba(0,0,0,0.25)",
  borderRadius: 4,
  padding: "4px 7px",
  minWidth: 34,
};
const partyRosterCardStyle14: CSSProperties = {
  fontSize: 9,
  color: "#7A6A52",
  fontFamily: fonts.display,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
};
const partyRosterCardStyle15: CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  color: "#D4C8B0",
  fontFamily: fonts.display,
};
