import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Quest } from "@/types/RoomInteractions";
import { colors, fonts } from "@/theme";

export default function QuestDescription({
  isOpen = false,
  onOpenChange,
  npcsName,
  quest,
}: {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  npcsName: string;
  quest: Quest;
}) {
  console.log("Rendering QuestDescription with quest:", quest);
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
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
        <DialogHeader
          style={{
            padding: "18px 22px 14px",
            borderBottom: "1px solid rgba(180,140,80,0.12)",
          }}
          className="space-y-0"
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <DialogTitle
              style={{
                margin: 0,
                fontSize: 16,
                fontWeight: 700,
                color: colors.goldMuted,
                fontFamily: fonts.display,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              {npcsName}'s Quest
            </DialogTitle>
          </div>
        </DialogHeader>

        <ScrollArea style={{ height: "60vh" }}>
          <div
            style={{
              padding: "10px 14px 20px",
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            <div
              style={{
                padding: "10px 12px",
                background: "rgba(255,255,255,0.025)",
                border: "1px solid rgba(180,140,80,0.14)",
                borderRadius: 7,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: colors.textMuted,
                  fontFamily: fonts.display,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  marginBottom: 6,
                }}
              >
                Description
              </div>
              <div style={{ fontSize: 13, color: "#7A6A52", lineHeight: 1.5 }}>
                Help {npcsName} {quest.description}
              </div>
            </div>

            <div
              style={{
                padding: "10px 12px",
                background: "rgba(255,255,255,0.025)",
                border: "1px solid rgba(180,140,80,0.14)",
                borderRadius: 7,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: colors.textMuted,
                  fontFamily: fonts.display,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  marginBottom: 6,
                }}
              >
                Objectives
              </div>
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
            </div>

            {quest.type.type === "defeat" && (
              <div
                style={{
                  padding: "10px 12px",
                  background: "rgba(255,255,255,0.025)",
                  border: "1px solid rgba(180,140,80,0.14)",
                  borderRadius: 7,
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    color: colors.textMuted,
                    fontFamily: fonts.display,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    marginBottom: 6,
                  }}
                >
                  Objective
                </div>
                <div
                  style={{ fontSize: 13, color: "#7A6A52", lineHeight: 1.5 }}
                >
                  Defeat{" "}
                  <span style={{ fontWeight: 700, color: colors.goldMuted }}>
                    {quest.type.enemy.name}
                  </span>{" "}
                  to complete the quest.
                </div>
              </div>
            )}

            {/* Rewards */}
            <div
              style={{
                padding: "10px 12px",
                background: "rgba(255,255,255,0.025)",
                border: "1px solid rgba(180,140,80,0.14)",
                borderRadius: 7,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: colors.textMuted,
                  fontFamily: fonts.display,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  marginBottom: 6,
                }}
              >
                Rewards
              </div>
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
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
