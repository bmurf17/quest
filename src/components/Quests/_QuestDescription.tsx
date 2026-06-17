import { ScrollArea } from "@/components/ui/scroll-area";
import { Quest } from "@/types/RoomInteractions";
import { colors, fonts } from "@/theme";
import { useGameStore } from "@/state/GameState";
import { QuestSectionBox, QuestSectionLabel } from "./_QuestPanelParts";

export default function QuestDescription({
  npcsName,
  quest,
  onAccepted,
  showAcceptButton,
}: {
  npcsName: string;
  quest: Quest;
  onAccepted?: () => void;
  showAcceptButton?: boolean;
}) {
  const { acceptQuest } = useGameStore();

  return (
    <>
      <ScrollArea style={{ height: "60vh" }}>
        <div
          style={{
            padding: "10px 14px 20px",
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          <QuestSectionBox>
            <QuestSectionLabel>Description</QuestSectionLabel>
            <div style={{ fontSize: 13, color: "#7A6A52", lineHeight: 1.5 }}>
              Help {npcsName} {quest.description}
            </div>
          </QuestSectionBox>

          <QuestSectionBox>
            <QuestSectionLabel>Objectives</QuestSectionLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {quest.objectives.map((objective, index) => (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 8,
                    fontSize: 13,
                    color: "#7A6A52",
                    lineHeight: 1.5,
                  }}
                >
                  <span
                    style={{
                      color: colors.goldMuted,
                      flexShrink: 0,
                      marginTop: 1,
                    }}
                  >
                    ◆
                  </span>
                  <span>{objective}</span>
                </div>
              ))}
            </div>
          </QuestSectionBox>

          {quest.type.type === "defeat" && (
            <QuestSectionBox>
              <QuestSectionLabel>Objective</QuestSectionLabel>
              <div style={{ fontSize: 13, color: "#7A6A52", lineHeight: 1.5 }}>
                Defeat{" "}
                <span style={{ fontWeight: 700, color: colors.goldMuted }}>
                  {quest.type.enemy.name}
                </span>{" "}
                to complete the quest.
              </div>
            </QuestSectionBox>
          )}

          <QuestSectionBox>
            <QuestSectionLabel>Rewards</QuestSectionLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {quest.rewards.map((reward, index) => (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: 13,
                    color: "#7A6A52",
                  }}
                >
                  <span style={{ color: colors.goldMuted, flexShrink: 0 }}>
                    ◆
                  </span>
                  <span>{reward.name}</span>
                </div>
              ))}
            </div>
          </QuestSectionBox>
        </div>
      </ScrollArea>

      {showAcceptButton ? (
        <div className="flex h-16">
          <button
            onClick={() => {
              acceptQuest(quest);
              onAccepted?.();
            }}
            disabled={quest.accepted || quest.completed}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              padding: "10px 12px",
              background: "rgba(5,150,105,0.07)",
              border: `1px solid rgba(52,211,153,0.25)`,
              borderRadius: 6,
              color: quest.accepted || quest.completed ? "gray" : "#6EE7B7",
              fontSize: 12,
              fontFamily: fonts.display,
              fontWeight: 600,
              letterSpacing: "0.05em",
              cursor: "pointer",
              transition: "background 0.15s, border-color 0.15s",
              width: "100%",
              opacity: 1,
              userSelect: "none",
              margin: "8px",
    
            }}
          >
            <span>Accept Quest</span>
          </button>
        </div>
      ) : (
        <> </>
      )}
    </>
  );
}
