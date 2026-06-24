import { useCharacter } from "../CharacterContext";
import { colors, fonts } from "@/theme";

const ABILITIES = [
  { key: "strength", label: "Strength" },
  { key: "dexterity", label: "Dexterity" },
  { key: "constitution", label: "Constitution" },
  { key: "intelligence", label: "Intelligence" },
  { key: "wisdom", label: "Wisdom" },
  { key: "charisma", label: "Charisma" },
] as const;

export default function AbilitiesForm() {
  const { character, updateCharacter } = useCharacter();

  const handleAbilityChange = (ability: string, value: string) => {
    const numValue = Number.parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= 1 && numValue <= 20) {
      updateCharacter("abilities", {
        ...character.abilities,
        [ability]: numValue,
      });
    }
  };

  return (
    <>
      <style>{`
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        input[type=number] { -moz-appearance: textfield; }
        .ability-card:hover { border-color: rgba(180,140,80,0.28) !important; background: rgba(255,255,255,0.05) !important; }
      `}</style>
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
            Set Your Abilities
          </span>
          <div style={{ flex: 1, height: 1, background: colors.goldBorder }} />
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 8,
          }}
        >
          {ABILITIES.map(({ key, label }) => {
            const val = character.abilities[key as keyof typeof character.abilities];
            return (
              <div
                key={key}
                className="ability-card"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(180,140,80,0.12)",
                  borderRadius: 7,
                  padding: "14px 14px",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  transition: "border-color 0.12s, background 0.12s",
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    background: "rgba(0,0,0,0.3)",
                    borderRadius: 6,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <input
                    type="number"
                    value={val}
                    onChange={(e) => handleAbilityChange(key, e.target.value)}
                    min={1}
                    max={20}
                    style={{
                      width: 44,
                      height: 44,
                      background: "transparent",
                      border: "none",
                      color: colors.text,
                      fontSize: 20,
                      fontWeight: 700,
                      fontFamily: fonts.display,
                      textAlign: "center",
                      outline: "none",
                      padding: 0,
                    }}
                  />
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 10,
                      color: colors.textMuted,
                      fontFamily: fonts.display,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                    }}
                  >
                    {label}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "#6B5E48",
                      marginTop: 1,
                      fontFamily: fonts.body,
                    }}
                  >
                    1 – 20
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
