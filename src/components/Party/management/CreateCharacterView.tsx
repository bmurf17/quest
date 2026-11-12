import { useState } from "react";
import { CharacterData } from "@/types/Character";
import { colors, fonts } from "@/theme";
import { MAX_SCORE, POINT_BUDGET } from "@/consts/constants";
import { useCharacter } from "../../CharacterCreation/CharacterContext";
import CharacterOverview from "../../CharacterCreation/CharacterOverview";
import OriginForm from "../../CharacterCreation/forms/OriginForm";
import RaceForm from "../../CharacterCreation/forms/RaceForm";
import ClassForm from "../../CharacterCreation/forms/ClassForm";
import AbilitiesForm from "../../CharacterCreation/forms/AbilitesForm";
import ImageForm from "../../CharacterCreation/forms/ImageForm";
import { SectionHeader } from "../shared/SectionHeader";
import { TABS, buildCharacter } from "./characterBuilder";

export function CreateCharacterView({
  onCreate,
}: {
  onCreate: (char: CharacterData) => void;
}) {
  const { character, updateCharacter } = useCharacter();
  const [activeTab, setActiveTab] = useState("name");

  const abilities = character.abilities;
  const totalSpent =
    (abilities.strength - 8) +
    (abilities.dexterity - 8) +
    (abilities.constitution - 8) +
    (abilities.intelligence - 8) +
    (abilities.wisdom - 8) +
    (abilities.charisma - 8) +
    (abilities.defense - 8);
  const canCreate =
    character.name.trim() &&
    character.race &&
    character.class &&
    character.image &&
    Object.values(abilities).every((v) => v >= 1 && v <= MAX_SCORE) &&
    totalSpent === POINT_BUDGET;

  const handleCreate = () => {
    if (!canCreate) return;
    const charData = buildCharacter(character);
    onCreate(charData);
  };

  return (
    <>
      <div
        style={{
          width: 260,
          flexShrink: 0,
          borderRight: "1px solid rgba(180,140,80,0.12)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          background: "rgba(0,0,0,0.25)",
        }}
      >
        <div
          style={{
            padding: "18px",
            borderBottom: "1px solid rgba(180,140,80,0.1)",
          }}
        >
          <CharacterOverview />
        </div>
        <div
          style={{
            padding: "8px 10px",
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          {TABS.map(({ key, label }) => {
            const active = activeTab === key;
            return (
              <div
                key={key}
                onClick={() => setActiveTab(key)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 11px",
                  borderRadius: 7,
                  border: `1px solid ${active ? "rgba(212,175,55,0.4)" : "transparent"}`,
                  background: active
                    ? "rgba(212,175,55,0.09)"
                    : "transparent",
                  cursor: "pointer",
                  transition: "background 0.12s, border-color 0.12s",
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.background =
                      "rgba(212,175,55,0.07)";
                    e.currentTarget.style.borderColor =
                      "rgba(212,175,55,0.25)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.borderColor = "transparent";
                  }
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: active
                      ? colors.gold
                      : "rgba(180,140,80,0.2)",
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontSize: 13,
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

      <div
        style={{
          flex: 1,
          overflowY: "auto",
          borderRight: `1px solid ${colors.goldBorder}`,
        }}
      >
        <div style={{ padding: "28px" }}>
          {activeTab === "name" && (
            <div>
              <SectionHeader margin="0 0 18px">Name Your Character</SectionHeader>
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
          )}
          {activeTab === "origin" && <OriginForm />}
          {activeTab === "race" && <RaceForm />}
          {activeTab === "class" && <ClassForm />}
          {activeTab === "abilities" && <AbilitiesForm />}
          {activeTab === "image" && <ImageForm />}

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
        </div>
      </div>

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
    </>
  );
}
