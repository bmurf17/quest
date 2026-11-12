import { useCharacter } from "@/components/CharacterCreation/CharacterContext";
import { colors, fonts } from "@/theme";
import warriorImg from "@/assets/warrior.png";
import rogueImg from "@/assets/rogue.png";
import rogue1Img from "@/assets/rogue-1.png";
import clericImg from "@/assets/cleric.png";
import wizardImg from "@/assets/wizard.png";
import bardImg from "@/assets/bard.png";
import barbarianImg from "@/assets/barbarian.png";
import assassinImg from "@/assets/assassin.png";
import type { CSSProperties } from "react";

const IMAGES = [
  { key: "warrior", src: warriorImg, label: "Warrior" },
  { key: "rogue", src: rogueImg, label: "Rogue" },
  { key: "cleric", src: clericImg, label: "Cleric" },
  { key: "wizard", src: wizardImg, label: "Wizard" },
  { key: "bard", src: bardImg, label: "Bard" },
  { key: "barbarian", src: barbarianImg, label: "Barbarian" },
  { key: "assassin", src: assassinImg, label: "Assassin" },
  { key: "rogue-1", src: rogue1Img, label: "Rogue 1" },
];

export default function ImageForm() {
  const { character, updateCharacter } = useCharacter();

  return (
    <>
      <div>
        <div style={imageFormStyle}>
          <span style={imageFormStyle2}>Choose Your Portrait</span>
          <div style={imageFormStyle3} />
        </div>
        <div style={imageFormStyle4}>
          {IMAGES.map(({ key, src, label }) => {
            const active = character.image === key;
            return (
              <button
                type="button"
                key={key}
                className="image-card"
                onClick={() => updateCharacter("image", key)}
                aria-pressed={active}
                style={{
                  font: "inherit",
                  width: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 8,
                  padding: "14px 10px",
                  borderRadius: 7,
                  border: `1px solid ${active ? "rgba(212,175,55,0.4)" : "rgba(180,140,80,0.12)"}`,
                  background: active ? "rgba(212,175,55,0.09)" : "rgba(255,255,255,0.03)",
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
                    border: active ? "2px solid rgba(212,175,55,0.6)" : "2px solid transparent",
                    transition: "border-color 0.12s",
                  }}
                >
                  <img src={src} alt={label} style={imageFormStyle5} />
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
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}

// Static style objects hoisted out of the render path.
const imageFormStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  margin: "0 0 18px",
};
const imageFormStyle2: CSSProperties = {
  fontSize: 11,
  color: colors.goldMuted,
  fontFamily: fonts.display,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  fontWeight: 700,
  whiteSpace: "nowrap",
};
const imageFormStyle3: CSSProperties = { flex: 1, height: 1, background: colors.goldBorder };
const imageFormStyle4: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
  gap: 10,
};
const imageFormStyle5: CSSProperties = {
  width: 80,
  height: 80,
  imageRendering: "pixelated",
};
