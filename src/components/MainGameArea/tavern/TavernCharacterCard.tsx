import { useState } from "react";
import type { CharacterData } from "@/types/Character";
import { colors, fonts } from "@/theme";
import { StatBar } from "@/components/shared/StatBar";
import { TavernAbilityTooltip } from "./TavernAbilityTooltip";

export function TavernCharacterCard({
  character,
  onView,
}: {
  character: CharacterData;
  onView: (char: CharacterData) => void;
}) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: 180,
        background: "rgba(0,0,0,0.6)",
        border: `1px solid ${colors.goldBorder}`,
        borderRadius: 10,
        overflow: "hidden",
        cursor: "pointer",
        transition: "border-color 0.15s, transform 0.15s, box-shadow 0.15s",
      }}
      onMouseEnter={(e) => {
        setShowTooltip(true);
        e.currentTarget.style.borderColor = colors.gold;
        e.currentTarget.style.transform = "translateY(-3px)";
        e.currentTarget.style.boxShadow = "0 8px 24px rgba(212,175,55,0.15)";
      }}
      onMouseLeave={(e) => {
        setShowTooltip(false);
        e.currentTarget.style.borderColor = colors.goldBorder;
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }}
      onClick={() => onView(character)}
    >
      <div
        style={{
          width: 140,
          height: 140,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginTop: 16,
          background: "rgba(0,0,0,0.3)",
          borderRadius: 8,
        }}
      >
        <img
          src={character.img}
          alt={character.name}
          style={{
            width: 120,
            height: 120,
            imageRendering: "pixelated",
            filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.8))",
          }}
        />
      </div>

      <div style={{ padding: "12px 14px", width: "100%", textAlign: "center" }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: colors.text,
            fontFamily: fonts.display,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            marginBottom: 4,
          }}
        >
          {character.name}
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 6,
            marginBottom: 10,
          }}
        >
          <span
            style={{
              fontSize: 10,
              color: colors.goldMuted,
              background: "rgba(180,140,80,0.1)",
              border: `1px solid ${colors.goldBorder}`,
              borderRadius: 4,
              padding: "2px 8px",
              fontFamily: fonts.display,
            }}
          >
            {character.class}
          </span>
          <span
            style={{
              fontSize: 10,
              color: colors.textMuted,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 4,
              padding: "2px 8px",
              fontFamily: fonts.display,
            }}
          >
            Lv{character.level}
          </span>
        </div>

        <div style={{ marginBottom: 4 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 2,
            }}
          >
            <span
              style={{
                fontSize: 9,
                color: colors.danger,
                fontFamily: fonts.display,
                fontWeight: 700,
              }}
            >
              HP
            </span>
            <span
              style={{
                fontSize: 9,
                color: colors.textMuted,
                fontFamily: fonts.body,
              }}
            >
              {character.hp}/{character.maxHp}
            </span>
          </div>
          <StatBar
            value={character.hp}
            max={character.maxHp}
            color={colors.danger}
            trackColor="rgba(255,255,255,0.06)"
            border={false}
            transition="width 0.3s"
            lowThreshold={0}
          />
        </div>
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 2,
            }}
          >
            <span
              style={{
                fontSize: 9,
                color: "#6366F1",
                fontFamily: fonts.display,
                fontWeight: 700,
              }}
            >
              MP
            </span>
            <span
              style={{
                fontSize: 9,
                color: colors.textMuted,
                fontFamily: fonts.body,
              }}
            >
              {character.mp}/{character.maxMp}
            </span>
          </div>
          <StatBar
            value={character.mp}
            max={character.maxMp}
            color="#6366F1"
            trackColor="rgba(255,255,255,0.06)"
            border={false}
            transition="width 0.3s"
            lowThreshold={0}
          />
        </div>
      </div>

      {showTooltip && <TavernAbilityTooltip character={character} />}

      <div
        style={{
          width: "100%",
          padding: "8px 14px 14px",
        }}
      >
        <div
          style={{
            width: "100%",
            padding: "8px 0",
            background: `linear-gradient(135deg, ${colors.gold} 0%, #B4965A 100%)`,
            border: "none",
            borderRadius: 6,
            color: "#0d0b07",
            fontSize: 11,
            fontWeight: 700,
            fontFamily: fonts.display,
            letterSpacing: "0.06em",
            textAlign: "center",
            cursor: "pointer",
            transition: "filter 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.filter = "brightness(1.1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.filter = "none";
          }}
          onClick={(e) => {
            e.stopPropagation();
            onView(character);
          }}
        >
          View Character
        </div>
      </div>
    </div>
  );
}
