import { useState } from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { colors, fonts } from "@/theme";
import { useGameStore } from "@/state/GameState";
import { Quest } from "@/types/RoomInteractions";
import QuestDescription from "./_QuestDescription";
import { QuestPanelHeader } from "./_QuestPanelParts";
import { ScrollArea } from "@radix-ui/react-scroll-area";

export default function QuestList({
  isOpen = false,
  onOpenChange,
}: {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const { quests } = useGameStore();
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);

  const handleOpenChange = (open: boolean) => {
    if (!open) setSelectedQuest(null);
    onOpenChange?.(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        className="gap-0 p-0"
        style={{
          maxWidth: 480,
          background: "linear-gradient(160deg, #0d0b07 0%, #1a1209 100%)",
          border: `1px solid ${colors.goldBorder}`,
          borderRadius: 12,
          padding: 0,
          overflow: "hidden",
          fontFamily: fonts.body,
          color: colors.text,
        }}
      >
        {selectedQuest ? (
          <>
            <QuestPanelHeader
              title={`${(selectedQuest as any).npcName ?? selectedQuest.name}'s Quest`}
              onBack={() => setSelectedQuest(null)}
            />
            <QuestDescription
              npcsName={(selectedQuest as any).npcName ?? selectedQuest.name}
              quest={selectedQuest}
              onAccepted={() => {
                setSelectedQuest(null);
                handleOpenChange(false);
              }}
              showAcceptButton={false}
            />
          </>
        ) : (
          <>
            <QuestPanelHeader title="Quest Journal" />
            <ScrollArea style={{ height: "60vh" }}>
              <div
                style={{
                  padding: "10px 14px 20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                {quests.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "48px 16px" }}>
                    <div
                      style={{ fontSize: 28, opacity: 0.15, marginBottom: 10 }}
                    >
                      ◇
                    </div>
                    <p
                      style={{
                        margin: 0,
                        color: colors.muted,
                        fontSize: 13,
                        fontFamily: fonts.display,
                      }}
                    >
                      You have no active quests
                    </p>
                  </div>
                ) : (
                  quests.map((quest) => (
                    <div
                      key={quest.id}
                      onClick={() => setSelectedQuest(quest)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 14,
                        padding: "10px 12px",
                        background: "rgba(255,255,255,0.025)",
                        border: "1px solid rgba(180,140,80,0.14)",
                        borderRadius: 7,
                        cursor: "pointer",
                        transition:
                          "background 0.15s, border-color 0.15s, transform 0.1s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background =
                          "rgba(180,140,80,0.08)";
                        e.currentTarget.style.borderColor =
                          "rgba(212,175,55,0.35)";
                        e.currentTarget.style.transform = "translateX(2px)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background =
                          "rgba(255,255,255,0.025)";
                        e.currentTarget.style.borderColor =
                          "rgba(180,140,80,0.14)";
                        e.currentTarget.style.transform = "translateX(0)";
                      }}
                      onMouseDown={(e) => {
                        e.currentTarget.style.transform = "scale(0.99)";
                      }}
                      onMouseUp={(e) => {
                        e.currentTarget.style.transform = "translateX(2px)";
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 700,
                            color: colors.text,
                            fontFamily: fonts.display,
                            letterSpacing: "0.02em",
                            marginBottom: 3,
                          }}
                        >
                          {quest.name}
                        </div>
                        {(quest as any).description && (
                          <div
                            style={{
                              fontSize: 12,
                              color: "#7A6A52",
                              lineHeight: 1.4,
                            }}
                          >
                            {(quest as any).description}
                          </div>
                        )}
                      </div>

                      <div
                        style={{
                          flexShrink: 0,
                          fontSize: 10,
                          color: colors.textMuted,
                          fontFamily: fonts.display,
                          letterSpacing: "0.06em",
                          textTransform: "uppercase",
                          border: `1px solid ${colors.goldBorder}`,
                          borderRadius: 4,
                          padding: "3px 8px",
                        }}
                      >
                        View
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}