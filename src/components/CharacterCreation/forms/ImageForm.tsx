import { useCharacter } from "../CharacterContext";
import { colors, fonts } from "@/theme";
import warriorImg from "../../../assets/Warrior.png";
import rogueImg from "../../../assets/Rogue.png";
import clericImg from "../../../assets/Cleric.png";
import wizardImg from "../../../assets/Wizard.png";
import bardImg from "../../../assets/Bard.png";
import barbarianImg from "../../../assets/Barbarian.png";
import assassinImg from "../../../assets/Assassin.png";

const IMAGES = [
  { key: "warrior", src: warriorImg, label: "Warrior" },
  { key: "rogue", src: rogueImg, label: "Rogue" },
  { key: "cleric", src: clericImg, label: "Cleric" },
  { key: "wizard", src: wizardImg, label: "Wizard" },
  { key: "bard", src: bardImg, label: "Bard" },
  { key: "barbarian", src: barbarianImg, label: "Barbarian" },
  { key: "assassin", src: assassinImg, label: "Assassin" },
];

export default function ImageForm() {
  const { character, updateCharacter } = useCharacter();

  return (
    <>
      <style>{`
        .image-card:hover { background: rgba(212,175,55,0.07) !important; border-color: rgba(212,175,55,0.25) !important; }
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
            Choose Your Portrait
          </span>
          <div style={{ flex: 1, height: 1, background: colors.goldBorder }} />
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
            gap: 10,
          }}
        >
          {IMAGES.map(({ key, src, label }) => {
            const active = character.image === key;
            return (
              <div
                key={key}
                className="image-card"
                onClick={() => updateCharacter("image", key)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 8,
                  padding: "14px 10px",
                  borderRadius: 7,
                  border: `1px solid ${active ? "rgba(212,175,55,0.4)" : "rgba(180,140,80,0.12)"}`,
                  background: active
                    ? "rgba(212,175,55,0.09)"
                    : "rgba(255,255,255,0.03)",
                  cursor: "pointer",
                  transition: "background 0.12s, border-color 0.12s",
                }}
              >
                <div
                  style={{
                    width: 80,
                    height: 80,
                    background: "rgba(0,0,0,0.4)",
                    borderRadius: 8,
                    overflow: "hidden",
                    border: active
                      ? "2px solid rgba(212,175,55,0.6)"
                      : "2px solid transparent",
                    transition: "border-color 0.12s",
                  }}
                >
                  <img
                    src={src}
                    alt={label}
                    style={{
                      width: 80,
                      height: 80,
                      imageRendering: "pixelated",
                    }}
                  />
                </div>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: active ? colors.text : colors.textMuted,
                    fontFamily: fonts.display,
                  }}
                >
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
