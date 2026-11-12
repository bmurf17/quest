import { useCharacter } from "@/components/CharacterCreation/CharacterContext";
import { colors, fonts } from "@/theme";

export default function NameForm() {
  const { character, updateCharacter } = useCharacter();

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          margin: "0 0 18px",
        }}
      >
        <span
          style={{
            fontSize: 11,
            color: colors.goldMuted,
            fontFamily: fonts.display,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            fontWeight: 700,
            whiteSpace: "nowrap",
          }}
        >
          Name Your Character
        </span>
        <div style={{ flex: 1, height: 1, background: colors.goldBorder }} />
      </div>
      <input
        type="text"
        value={character.name}
        onChange={(e) => updateCharacter("name", e.target.value)}
        placeholder="Enter character name..."
        maxLength={30}
        style={{
          width: "100%",
          padding: "14px 16px",
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(180,140,80,0.2)",
          borderRadius: 7,
          color: colors.text,
          fontFamily: fonts.display,
          fontSize: 18,
          fontWeight: 700,
          outline: "none",
          boxSizing: "border-box",
        }}
      />
    </div>
  );
}
