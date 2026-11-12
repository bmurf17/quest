import { useState } from "react";
import type { CharacterData } from "@/types/Character";
import { tempRanger } from "@/data/fixtures/characters";
import CharacterSheet from "@/components/CharacterSheet";
import { useGameStore } from "@/state/GameState";

interface Props {
  party: CharacterData[];
}


import { colors, fonts } from "@/theme";
import { StatBar } from "@/components/shared/StatBar";
import type { CSSProperties } from "react";

export default function Party({ party }: Props) {
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterData>(tempRanger);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isTargeting = useGameStore((state) => state.isTargeting);
  const targetingSpell = useGameStore((state) => state.targetingSpell);
  const targetingConsumable = useGameStore((state) => state.targetingConsumable);
  const castSpell = useGameStore((state) => state.castSpell);
  const consumeItem = useGameStore((state) => state.consumeItem);
  const setTargeting = useGameStore((state) => state.setTargeting);
  const setTargetingSpell = useGameStore((state) => state.setTargetingSpell);
  const setTargetingConsumable = useGameStore((state) => state.setTargetingConsumable);

  const isTargetingHeal =
    isTargeting &&
    targetingSpell &&
    targetingSpell.effect.type === "heal" &&
    targetingSpell.effect.target === "single";

  const isTargetingConsumable = isTargeting && !!targetingConsumable;

  const handleCharacterClick = (character: CharacterData) => {
    if (isTargetingHeal) {
      if (!character.alive || character.hp <= 0) return;
      castSpell(targetingSpell, character);
      setTargeting(false);
      setTargetingSpell(null);
    } else if (isTargetingConsumable) {
      consumeItem(targetingConsumable, character);
      setTargeting(false);
      setTargetingConsumable(null);
    } else {
      setSelectedCharacter(character);
      setIsModalOpen(true);
    }
  };

  return (
    <>

      {isTargetingHeal && (
        <div
          style={partyStyle}
        >
          <div
            style={partyStyle2}
          />
          <span
            style={partyStyle3}
          >
            Select a party member to heal
          </span>
        </div>
      )}

      {isTargetingConsumable && (
        <div
          style={partyStyle}
        >
          <div
            style={partyStyle2}
          />
          <span
            style={partyStyle3}
          >
            Select a party member to use {targetingConsumable?.name}
          </span>
        </div>
      )}

      <div
  style={partyStyle4}
      >
        {party.map((character, i) => {
          const isDead = character.alive === false || character.hp <= 0;
          const hpPct = (character.hp / character.maxHp) * 100;
          const isLowHp = hpPct <= 25 && !isDead;

          return (
        <button
          type="button"
          key={i}
          onClick={() => handleCharacterClick(character)}
          disabled={isDead}
          aria-label={
            isTargetingHeal
              ? `Heal ${character.name}`
              : isTargetingConsumable
                ? `Use ${targetingConsumable?.name} on ${character.name}`
                : `View ${character.name}`
          }
          style={{
                padding: 0,
                font: "inherit",
                textAlign: "left",
                flexShrink: 0,
                flex: 1,
                minWidth: 0,
                maxWidth: 240,
                height: "100%",
                display: "flex",
                flexDirection: "column",
                background: isDead
                  ? "rgba(0,0,0,0.2)"
                  : isLowHp
                    ? "rgba(239,68,68,0.05)"
                    : "rgba(255,255,255,0.025)",
                border: `1px solid ${isDead ? colors.subtleBorder : isLowHp ? 'rgba(239,68,68,0.3)' : colors.goldBorder}`,
                borderRadius: 6,
                overflow: "hidden",
                opacity: isDead ? 0.4 : 1,
                filter: isDead ? "grayscale(1)" : "none",
                cursor: isDead ? "default" : "pointer",
              }}
            >
              <div
                style={partyStyle5}
              >
                <img
                  src={character.img}
                  alt={character.name}
                  style={partyStyle6}
                />
                <div
                  style={partyStyle7}
                >
                  <div
                    style={partyStyle8}
                  >
                    {character.name}
                  </div>
                </div>
                {isDead && (
                  <div
                    style={partyStyle9}
                  >
                    <span
                      style={partyStyle10}
                    >
                      FALLEN
                    </span>
                  </div>
                )}
              </div>

              <div
                style={partyStyle11}
              >
                <div
                  style={partyStyle12}
                >
                  <span
                    style={{
                      fontSize: 8,
                      color: isLowHp ? colors.danger : colors.muted,
                      fontFamily: fonts.display,
                      fontWeight: 700,
                      letterSpacing: "0.06em",
                    }}
                  >
                    HP
                  </span>
                  <span
                    style={{
                      fontSize: 8,
                      color: isLowHp ? colors.danger : colors.textMuted,
                      fontFamily: fonts.body,
                    }}
                  >
                    {character.hp}/{character.maxHp}
                  </span>
                </div>
                <div style={{ marginBottom: 4 }}>
                  <StatBar value={character.hp} max={character.maxHp} color={isLowHp ? colors.danger : colors.success} />
                </div>
                <div
                  style={partyStyle12}
                >
                  <span
                    style={partyStyle13}
                  >
                    MP
                  </span>
                  <span
                    style={partyStyle14}
                  >
                    {character.mp}/{character.maxMp}
                  </span>
                </div>
                <div>
                  <StatBar value={character.mp} max={character.maxMp} color="#6366F1" />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <CharacterSheet
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        characterData={selectedCharacter}
      />
    </>
  );
}

// Static style objects hoisted out of the render path.
const partyStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  padding: "8px 16px",
  background: "rgba(5,150,105,0.12)",
  border: `1px solid ${colors.success}`,
  borderRadius: 6,
  marginBottom: 8,
};
const partyStyle2: CSSProperties = {
  width: 6,
  height: 6,
  background: colors.success,
  borderRadius: "50%",
  boxShadow: "0 0 6px rgba(52,211,153,0.8)",
};
const partyStyle3: CSSProperties = {
  fontSize: 12,
  color: colors.success,
  fontFamily: fonts.display,
  letterSpacing: "0.06em",
};
const partyStyle4: CSSProperties = {
  flex: 1,
  minHeight: 0,
  display: "flex",
  gap: 8,
  overflowX: "auto",
  overflowY: "hidden",
};
const partyStyle5: CSSProperties = {
  flex: 1,
  minHeight: 0,
  position: "relative",
  overflow: "hidden",
};
const partyStyle6: CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
  imageRendering: "pixelated",
};
const partyStyle7: CSSProperties = {
  position: "absolute",
  bottom: 0,
  left: 0,
  right: 0,
  padding: "12px 5px 3px",
  background:
    "linear-gradient(to top, rgba(0,0,0,0.9), transparent)",
};
const partyStyle8: CSSProperties = {
  fontSize: 9,
  fontWeight: 700,
  color: colors.text,
  fontFamily: fonts.display,
  letterSpacing: "0.03em",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};
const partyStyle9: CSSProperties = {
  position: "absolute",
  inset: 0,
  background: "rgba(0,0,0,0.5)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};
const partyStyle10: CSSProperties = {
  fontSize: 9,
  color: colors.muted,
  fontFamily: fonts.display,
  letterSpacing: "0.08em",
};
const partyStyle11: CSSProperties = {
  padding: "5px 6px 6px",
  background: "rgba(0,0,0,0.3)",
  flexShrink: 0,
};
const partyStyle12: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  marginBottom: 2,
};
const partyStyle13: CSSProperties = {
  fontSize: 8,
  color: colors.muted,
  fontFamily: fonts.display,
  fontWeight: 700,
  letterSpacing: "0.06em",
};
const partyStyle14: CSSProperties = {
  fontSize: 8,
  color: colors.textMuted,
  fontFamily: fonts.body,
};
