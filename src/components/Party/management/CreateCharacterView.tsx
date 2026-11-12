import { CharacterData } from "@/types/Character";
import { colors, fonts } from "@/theme";
import { useCharacter } from "../../CharacterCreation/CharacterContext";
import { CharacterBuilderView } from "../../CharacterCreation/CharacterBuilder";
import { buildCharacter, canCreateCharacter } from "./characterBuilder";

function EmptyPartyPanel() {
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
      </div>
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "32px 24px",
          textAlign: "center",
        }}
      >
        <div>
          <p
            style={{
              margin: "0 0 8px",
              color: "#4B5563",
              fontSize: 13,
              fontFamily: fonts.display,
            }}
          >
            No party members yet
          </p>
          <p style={{ margin: 0, color: "#374151", fontSize: 13 }}>
            Build your character on the left, then click Create Character to
            start your adventure
          </p>
        </div>
      </div>
    </div>
  );
}

export function CreateCharacterView({
  onCreate,
}: {
  onCreate: (char: CharacterData) => void;
}) {
  const { character } = useCharacter();
  const canCreate = canCreateCharacter(character);

  const handleCreate = () => {
    if (!canCreate) return;
    onCreate(buildCharacter(character));
  };

  return (
    <CharacterBuilderView
      height="100vh"
      rightPanel={<EmptyPartyPanel />}
      footer={
        <button
          onClick={handleCreate}
          disabled={!canCreate}
          style={{
            width: "100%",
            padding: "15px",
            borderRadius: 8,
            fontFamily: fonts.display,
            fontWeight: 700,
            fontSize: 14,
            letterSpacing: "0.08em",
            cursor: canCreate ? "pointer" : "not-allowed",
            marginTop: 16,
            transition: "filter 0.15s, transform 0.1s",
            ...(canCreate
              ? {
                  background:
                    "linear-gradient(135deg, #B4965A 0%, #D4AF37 50%, #B4965A 100%)",
                  color: "#0d0b07",
                  border: "none",
                }
              : {
                  background: "rgba(255,255,255,0.04)",
                  color: "#4B5563",
                  border: "1px solid rgba(255,255,255,0.06)",
                }),
          }}
          onMouseEnter={(e) => {
            if (canCreate) e.currentTarget.style.filter = "brightness(1.08)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.filter = "none";
          }}
          onMouseDown={(e) => {
            if (canCreate) e.currentTarget.style.transform = "scale(0.99)";
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = "scale(1)";
          }}
        >
          {canCreate
            ? "⊕  Create Character & Start Party"
            : "Finish all steps"}
        </button>
      }
    />
  );
}
