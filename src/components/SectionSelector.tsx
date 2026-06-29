import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useGameStore } from "@/state/GameState";
import { colors, fonts } from "@/theme";

export default function SectionSelector({
  isOpen,
  onOpenChange,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const availableSections = useGameStore((s) => s.availableSections);
  const beatenSections = useGameStore((s) => s.beatenSections);
  const isSectionUnlocked = useGameStore((s) => s.isSectionUnlocked);
  const startSection = useGameStore((s) => s.startSection);
  const rooms = useGameStore((s) => s.rooms);

  const handleExplore = async (sectionId: number) => {
    if (!isSectionUnlocked(sectionId)) return;
    if (beatenSections.includes(sectionId)) return;

    try {
      startSection(sectionId, rooms);
      onOpenChange(false);
    } catch (err) {
      console.error("Failed to load section:", err);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        style={{
          maxWidth: 450,
          background: "linear-gradient(160deg, #0d0b07 0%, #1a1209 100%)",
          border: `1px solid ${colors.goldBorder}`,
          borderRadius: 12,
          padding: 0,
          overflow: "hidden",
          fontFamily: fonts.body,
          color: colors.text,
        }}
      >
        <DialogHeader style={{ padding: "18px 22px 14px", borderBottom: `1px solid ${colors.goldBorder}` }}>
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
            Explore
          </DialogTitle>
        </DialogHeader>

        <ScrollArea style={{ height: "55vh" }}>
          <div style={{ padding: "10px 14px 20px", display: "flex", flexDirection: "column", gap: 8 }}>
          {availableSections.map((section) => {
            const beaten = beatenSections.includes(section.id);
            const unlocked = isSectionUnlocked(section.id);
            const disabled = beaten || !unlocked;

            return (
              <div
                key={section.id}
                onClick={() => handleExplore(section.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 14px",
                  background: disabled ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${beaten ? "rgba(52,211,153,0.25)" : disabled ? colors.subtleBorder : colors.goldBorder}`,
                  borderRadius: 6,
                  cursor: disabled ? "not-allowed" : "pointer",
                  opacity: disabled ? 0.55 : 1,
                  transition: "background 0.15s, border-color 0.15s",
                }}
                onMouseEnter={(e) => {
                  if (!disabled) {
                    e.currentTarget.style.background = "rgba(180,140,80,0.1)";
                    e.currentTarget.style.borderColor = colors.gold;
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = disabled ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.04)";
                  e.currentTarget.style.borderColor = beaten ? "rgba(52,211,153,0.25)" : disabled ? colors.subtleBorder : colors.goldBorder;
                }}
              >
                <span
                  style={{
                    color: beaten ? "#6EE7B7" : disabled ? colors.muted : colors.text,
                    fontFamily: fonts.display,
                    fontSize: 14,
                    letterSpacing: "0.04em",
                  }}
                >
                  {section.name}
                </span>

                {beaten && (
                  <span
                    style={{
                      color: "#6EE7B7",
                      fontSize: 16,
                      lineHeight: 1,
                    }}
                    title="Completed"
                  >
                    ✓
                  </span>
                )}

                {!unlocked && !beaten && (
                  <span
                    style={{
                      color: colors.muted,
                      fontSize: 14,
                      lineHeight: 1,
                    }}
                    title="Complete the previous section first"
                  >
                    🔒
                  </span>
                )}

                {unlocked && !beaten && (
                  <span
                    style={{
                      color: colors.goldMuted,
                      fontSize: 12,
                      fontFamily: fonts.display,
                      letterSpacing: "0.06em",
                    }}
                  >
                    Explore →
                  </span>
                )}
              </div>
            );
          })}
        </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
