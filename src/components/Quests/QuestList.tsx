import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { colors, fonts } from "@/theme";
import { useGameStore } from "@/state/GameState";
import type { Quest } from "@/types/RoomInteractions";
import QuestDescription from "./_QuestDescription";
import { QuestPanelHeader } from "./_QuestPanelParts";
import { ScrollArea } from "@radix-ui/react-scroll-area";
import type { CSSProperties } from "react";

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
      <DialogContent className="gap-0 p-0" style={questListStyle}>
        {selectedQuest ? (
          <>
            <QuestPanelHeader
              title={`${selectedQuest.npcName ?? selectedQuest.name}'s Quest`}
              onBack={() => setSelectedQuest(null)}
            />
            <QuestDescription
              npcsName={selectedQuest.npcName ?? selectedQuest.name}
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
              <div style={questListStyle2}>
                {quests.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "48px 16px" }}>
                    <div style={questListStyle3}>◇</div>
                    <p style={questListStyle4}>You have no active quests</p>
                  </div>
                ) : (
                  quests.map((quest) => (
                    <button
                      type="button"
                      key={quest.id}
                      onClick={() => setSelectedQuest(quest)}
                      style={{
                        ...questListStyle5,
                        width: "100%",
                        font: "inherit",
                        textAlign: "left",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "rgba(180,140,80,0.08)";
                        e.currentTarget.style.borderColor = "rgba(212,175,55,0.35)";
                        e.currentTarget.style.transform = "translateX(2px)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "rgba(255,255,255,0.025)";
                        e.currentTarget.style.borderColor = "rgba(180,140,80,0.14)";
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
                        <div style={questListStyle6}>{quest.name}</div>
                        {quest.description && (
                          <div style={questListStyle7}>{quest.description}</div>
                        )}
                      </div>

                      <div style={questListStyle8}>View</div>
                    </button>
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

// Static style objects hoisted out of the render path.
const questListStyle: CSSProperties = {
  maxWidth: 480,
  background: "linear-gradient(160deg, #0d0b07 0%, #1a1209 100%)",
  border: `1px solid ${colors.goldBorder}`,
  borderRadius: 12,
  padding: 0,
  overflow: "hidden",
  fontFamily: fonts.body,
  color: colors.text,
};
const questListStyle2: CSSProperties = {
  padding: "10px 14px 20px",
  display: "flex",
  flexDirection: "column",
  gap: 6,
};
const questListStyle3: CSSProperties = { fontSize: 28, opacity: 0.15, marginBottom: 10 };
const questListStyle4: CSSProperties = {
  margin: 0,
  color: colors.muted,
  fontSize: 13,
  fontFamily: fonts.display,
};
const questListStyle5: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 14,
  padding: "10px 12px",
  background: "rgba(255,255,255,0.025)",
  border: "1px solid rgba(180,140,80,0.14)",
  borderRadius: 7,
  cursor: "pointer",
  transition: "background 0.15s, border-color 0.15s, transform 0.1s",
};
const questListStyle6: CSSProperties = {
  fontSize: 14,
  fontWeight: 700,
  color: colors.text,
  fontFamily: fonts.display,
  letterSpacing: "0.02em",
  marginBottom: 3,
};
const questListStyle7: CSSProperties = {
  fontSize: 12,
  color: "#7A6A52",
  lineHeight: 1.4,
};
const questListStyle8: CSSProperties = {
  flexShrink: 0,
  fontSize: 10,
  color: colors.textMuted,
  fontFamily: fonts.display,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  border: `1px solid ${colors.goldBorder}`,
  borderRadius: 4,
  padding: "3px 8px",
};
