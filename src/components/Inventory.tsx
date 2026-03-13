import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useGameStore } from "@/state/GameState";
import { colors, fonts } from "@/theme";
import { Consumable, Item } from "@/types/Item";

export default function Inventory({
  isOpen = false,
  onOpenChange,
  inventory,
}: {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  inventory: Item[];
}) {
  const useConsumable = useGameStore((state) => state.useConsumable);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
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

        <DialogHeader style={{ padding: "18px 22px 14px", borderBottom: "1px solid rgba(180,140,80,0.12)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <DialogTitle style={{
              margin: 0,
              fontSize: 16,
              fontWeight: 700,
              color: colors.goldMuted,
              fontFamily: fonts.display,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}>
              Inventory
            </DialogTitle>
            <span style={{
              fontSize: 11,
              color: colors.textMuted,
              fontFamily: fonts.display,
              letterSpacing: "0.06em",
            }}>
              {inventory.length} {inventory.length === 1 ? "item" : "items"}
            </span>
          </div>
        </DialogHeader>

        <ScrollArea style={{ height: "60vh" }}>
          <div style={{ padding: "10px 14px 20px", display: "flex", flexDirection: "column", gap: 6 }}>
            {inventory.length === 0 ? (
                <div style={{ textAlign: "center", padding: "48px 16px" }}>
                <div style={{ fontSize: 28, opacity: 0.15, marginBottom: 10 }}>◇</div>
                <p style={{ margin: 0, color: colors.muted, fontSize: 13, fontFamily: fonts.display }}>
                  Your satchel is empty
                </p>
              </div>
            ) : (
              inventory.map((item) => (
                <div
                  key={item.name}
                  onClick={() => useConsumable(item as Consumable)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    padding: "10px 12px",
                    background: "rgba(255,255,255,0.025)",
                    border: "1px solid rgba(180,140,80,0.14)",
                    borderRadius: 7,
                    cursor: "pointer",
                    transition: "background 0.15s, border-color 0.15s, transform 0.1s",
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
                  onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.99)"; }}
                  onMouseUp={(e) => { e.currentTarget.style.transform = "translateX(2px)"; }}
                >
                  <div style={{
                    width: 48, height: 48, flexShrink: 0,
                    background: "rgba(0,0,0,0.4)",
                    border: "1px solid rgba(180,140,80,0.15)",
                    borderRadius: 7,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <img
                      src={item.img}
                      alt={item.name}
                      style={{ width: 36, height: 36, imageRendering: "pixelated", filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.7))" }}
                    />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: colors.text, fontFamily: fonts.display, letterSpacing: "0.02em", marginBottom: 3 }}>
                      {item.name}
                    </div>
                    {(item as any).description && (
                      <div style={{ fontSize: 12, color: "#7A6A52", lineHeight: 1.4 }}>
                        {(item as any).description}
                      </div>
                    )}
                  </div>

                  <div style={{
                    flexShrink: 0,
                    fontSize: 10,
                    color: colors.textMuted,
                    fontFamily: fonts.display,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    border: `1px solid ${colors.goldBorder}`,
                    borderRadius: 4,
                    padding: "3px 8px",
                  }}>
                    Use
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}