import { useCharacter } from "./CharacterContext.tsx";
import { colors, fonts } from "@/theme";
import type { CSSProperties } from "react";

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div style={sectionHeaderStyle}>
      <span style={sectionHeaderStyle2}>{children}</span>
      <div style={sectionHeaderStyle3} />
    </div>
  );
}

function StatLine({ label, value }: { label: string; value: string }) {
  return (
    <div style={statLineStyle}>
      <span style={statLineStyle2}>{label}</span>
      <span
        style={{
          fontSize: 12,
          color: value === "Not selected" ? "#4B5563" : colors.text,
          fontFamily: fonts.display,
        }}
      >
        {value}
      </span>
    </div>
  );
}

export default function CharacterOverview() {
  const { character } = useCharacter();

  return (
    <div>
      <SectionHeader>Character</SectionHeader>
      <StatLine label="Name" value={character.name || "Not set"} />
      <StatLine label="Origin" value={character.origin || "Not selected"} />
      <StatLine label="Race" value={character.race || "Not selected"} />
      <StatLine label="Class" value={character.class || "Not selected"} />

      <div style={{ marginTop: 14 }}>
        <SectionHeader>Abilities</SectionHeader>
        <div style={characterOverviewStyle}>
          {Object.entries(character.abilities).map(([key, val]) => (
            <div key={key} style={characterOverviewStyle2}>
              <div style={characterOverviewStyle3}>{key.slice(0, 3)}</div>
              <div style={characterOverviewStyle4}>{val}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Static style objects hoisted out of the render path.
const sectionHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  margin: "0 0 10px",
};
const sectionHeaderStyle2: CSSProperties = {
  fontSize: 10,
  color: colors.goldMuted,
  fontFamily: fonts.display,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  fontWeight: 700,
  whiteSpace: "nowrap",
};
const sectionHeaderStyle3: CSSProperties = { flex: 1, height: 1, background: colors.goldBorder };
const statLineStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "5px 0",
  borderBottom: "1px solid rgba(255,255,255,0.04)",
};
const statLineStyle2: CSSProperties = {
  fontSize: 10,
  color: "#7A6A52",
  fontFamily: fonts.display,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
};
const characterOverviewStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 4,
};
const characterOverviewStyle2: CSSProperties = {
  textAlign: "center",
  background: "rgba(0,0,0,0.25)",
  borderRadius: 4,
  padding: "4px 6px",
};
const characterOverviewStyle3: CSSProperties = {
  fontSize: 8,
  color: "#7A6A52",
  fontFamily: fonts.display,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
};
const characterOverviewStyle4: CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  color: "#D4C8B0",
  fontFamily: fonts.display,
};
