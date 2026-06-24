import { useState } from "react";
import CharacterOverview from "./CharacterOverview.tsx";
import { CharacterProvider } from "./CharacterContext.tsx";
import OriginForm from "./forms/OriginForm.tsx";
import RaceForm from "./forms/RaceForm.tsx";
import SubraceForm from "./forms/SubraceForm.tsx";
import ClassForm from "./forms/ClassForm.tsx";
import BackgroundForm from "./forms/BackgroundForm.tsx";
import AbilitiesForm from "./forms/AbilitesForm.tsx";
import { colors, fonts } from "@/theme";

const TABS = [
  { key: "origin", label: "Origin" },
  { key: "race", label: "Race" },
  { key: "subrace", label: "Subrace" },
  { key: "class", label: "Class" },
  { key: "background", label: "Background" },
  { key: "abilities", label: "Abilities" },
] as const;

export default function CharacterBuilder() {
  const [activeTab, setActiveTab] = useState("origin");

  return (
    <CharacterProvider>
      <div
        style={{
          display: "flex",
          height: "calc(100vh - 42px)",
          overflow: "hidden",
          background: "#111009",
        }}
      >
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
                      e.currentTarget.style.background = "rgba(212,175,55,0.07)";
                      e.currentTarget.style.borderColor = "rgba(212,175,55,0.25)";
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
                      background: active ? colors.gold : "rgba(180,140,80,0.2)",
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
            padding: "28px",
          }}
        >
          {activeTab === "origin" && <OriginForm />}
          {activeTab === "race" && <RaceForm />}
          {activeTab === "subrace" && <SubraceForm />}
          {activeTab === "class" && <ClassForm />}
          {activeTab === "background" && <BackgroundForm />}
          {activeTab === "abilities" && <AbilitiesForm />}
        </div>
      </div>
    </CharacterProvider>
  );
}
