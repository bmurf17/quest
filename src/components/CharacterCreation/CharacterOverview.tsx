import { useCharacter } from "./CharacterContext.tsx";
import { colors, fonts } from "@/theme";

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        margin: "0 0 10px",
      }}
    >
      <span
        style={{
          fontSize: 10,
          color: colors.goldMuted,
          fontFamily: fonts.display,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          fontWeight: 700,
          whiteSpace: "nowrap",
        }}
      >
        {children}
      </span>
      <div style={{ flex: 1, height: 1, background: colors.goldBorder }} />
    </div>
  );
}

function StatLine({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "5px 0",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
      }}
    >
      <span
        style={{
          fontSize: 10,
          color: "#7A6A52",
          fontFamily: fonts.display,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </span>
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
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 4,
          }}
        >
          {Object.entries(character.abilities).map(([key, val]) => (
            <div
              key={key}
              style={{
                textAlign: "center",
                background: "rgba(0,0,0,0.25)",
                borderRadius: 4,
                padding: "4px 6px",
              }}
            >
              <div
                style={{
                  fontSize: 8,
                  color: "#7A6A52",
                  fontFamily: fonts.display,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                {key.slice(0, 3)}
              </div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#D4C8B0",
                  fontFamily: fonts.display,
                }}
              >
                {val}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
