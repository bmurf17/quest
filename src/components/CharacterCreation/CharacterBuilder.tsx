import { useState, type ReactNode } from "react";
import CharacterOverview from "./CharacterOverview";
import { CharacterProvider } from "./CharacterContext";
import NameForm from "./forms/NameForm";
import OriginForm from "./forms/OriginForm";
import RaceForm from "./forms/RaceForm";
import SubraceForm from "./forms/SubraceForm";
import ClassForm from "./forms/ClassForm";
import BackgroundForm from "./forms/BackgroundForm";
import AbilitiesForm from "./forms/AbilitesForm";
import ImageForm from "./forms/ImageForm";
import { colors, fonts } from "@/theme";

const CHARACTER_TABS = [
  { key: "name", label: "Name" },
  { key: "origin", label: "Origin" },
  { key: "race", label: "Race" },
  { key: "subrace", label: "Subrace" },
  { key: "class", label: "Class" },
  { key: "background", label: "Background" },
  { key: "abilities", label: "Abilities" },
  { key: "image", label: "Portrait" },
] as const;

function CharacterForm({ tab }: { tab: string }) {
  switch (tab) {
    case "name":
      return <NameForm />;
    case "origin":
      return <OriginForm />;
    case "race":
      return <RaceForm />;
    case "subrace":
      return <SubraceForm />;
    case "class":
      return <ClassForm />;
    case "background":
      return <BackgroundForm />;
    case "abilities":
      return <AbilitiesForm />;
    case "image":
      return <ImageForm />;
    default:
      return null;
  }
}

export function CharacterBuilderView({
  footer,
  rightPanel,
  height = "calc(100vh - 42px)",
}: {
  footer?: ReactNode;
  rightPanel?: ReactNode;
  height?: string;
}) {
  const [activeTab, setActiveTab] = useState<string>("name");

  return (
    <div
      style={{
        display: "flex",
        height,
        width: "100%",
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
          {CHARACTER_TABS.map(({ key, label }) => {
            const active = activeTab === key;
            return (
              <button
                key={key}
                type="button"
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
                  font: "inherit",
                  textAlign: "left",
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
              </button>
            );
          })}
        </div>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: "auto",
          borderRight: rightPanel ? `1px solid ${colors.goldBorder}` : undefined,
        }}
      >
        <div style={{ padding: "28px" }}>
          <CharacterForm tab={activeTab} />
          {footer}
        </div>
      </div>

      {rightPanel}
    </div>
  );
}

export default function CharacterBuilder() {
  return (
    <CharacterProvider>
      <CharacterBuilderView />
    </CharacterProvider>
  );
}
