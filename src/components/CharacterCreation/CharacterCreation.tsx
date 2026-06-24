import CharacterBuilder from "./CharacterBuilder";
import { colors, fonts } from "@/theme";

export default function CharacterCreation() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#111009",
        fontFamily: fonts.body,
        color: colors.text,
      }}
    >
      <div
        style={{
          padding: "20px 28px 0",
          borderBottom: "1px solid rgba(180,140,80,0.1)",
        }}
      >
        <h1
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
          Character Builder
        </h1>
      </div>
      <CharacterBuilder />
    </div>
  );
}
