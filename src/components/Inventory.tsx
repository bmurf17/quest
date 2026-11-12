import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useGameStore } from "@/state/GameState";
import { colors, fonts } from "@/theme";
import type { Consumable, Item } from "@/types/Item";
import type { CSSProperties } from "react";

export default function Inventory({
  isOpen = false,
  onOpenChange,
  inventory,
}: {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  inventory: Item[];
}) {
  const party = useGameStore((state) => state.party);
  const consumeItem = useGameStore((state) => state.consumeItem);
  const setTargeting = useGameStore((state) => state.setTargeting);
  const setTargetingConsumable = useGameStore((state) => state.setTargetingConsumable);

  const handleUseItem = (item: Item) => {
    const consumable = item as Consumable;
    if (consumable.target === "all") {
      consumeItem(consumable);
      return;
    }

    const livingParty = party.filter((m) => m.alive && m.hp > 0);
    if (livingParty.length <= 1) {
      consumeItem(consumable, livingParty[0] || party[0]);
      return;
    }

    onOpenChange?.(false);
    setTargeting(true);
    setTargetingConsumable(consumable);
  };
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent style={inventoryStyle}>
        <DialogHeader
          style={{ padding: "18px 22px 14px", borderBottom: "1px solid rgba(180,140,80,0.12)" }}
        >
          <div style={inventoryStyle2}>
            <DialogTitle style={inventoryStyle3}>Inventory</DialogTitle>
          </div>
        </DialogHeader>

        <ScrollArea style={{ height: "60vh" }}>
          <div style={inventoryStyle4}>
            {inventory.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 16px" }}>
                <div style={inventoryStyle5}>◇</div>
                <p style={inventoryStyle6}>Your satchel is empty</p>
              </div>
            ) : (
              inventory.map((item) => (
                <button
                  type="button"
                  key={item.name}
                  onClick={() => handleUseItem(item)}
                  style={{
                    ...inventoryStyle7,
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
                  <div style={inventoryStyle8}>
                    <img src={item.img} alt={item.name} style={inventoryStyle9} />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={inventoryStyle10}>{item.name}</div>
                    {item.description && <div style={inventoryStyle11}>{item.description}</div>}
                  </div>

                  <div style={inventoryStyle12}>Use</div>
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

// Static style objects hoisted out of the render path.
const inventoryStyle: CSSProperties = {
  maxWidth: 480,
  background: "linear-gradient(160deg, #0d0b07 0%, #1a1209 100%)",
  border: `1px solid ${colors.goldBorder}`,
  borderRadius: 12,
  padding: 0,
  overflow: "hidden",
  fontFamily: fonts.body,
  color: colors.text,
};
const inventoryStyle2: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
};
const inventoryStyle3: CSSProperties = {
  margin: 0,
  fontSize: 16,
  fontWeight: 700,
  color: colors.goldMuted,
  fontFamily: fonts.display,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
};
const inventoryStyle4: CSSProperties = {
  padding: "10px 14px 20px",
  display: "flex",
  flexDirection: "column",
  gap: 6,
};
const inventoryStyle5: CSSProperties = { fontSize: 28, opacity: 0.15, marginBottom: 10 };
const inventoryStyle6: CSSProperties = {
  margin: 0,
  color: colors.muted,
  fontSize: 13,
  fontFamily: fonts.display,
};
const inventoryStyle7: CSSProperties = {
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
const inventoryStyle8: CSSProperties = {
  width: 48,
  height: 48,
  flexShrink: 0,
  background: "rgba(0,0,0,0.4)",
  border: "1px solid rgba(180,140,80,0.15)",
  borderRadius: 7,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};
const inventoryStyle9: CSSProperties = {
  width: 36,
  height: 36,
  imageRendering: "pixelated",
  filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.7))",
};
const inventoryStyle10: CSSProperties = {
  fontSize: 14,
  fontWeight: 700,
  color: colors.text,
  fontFamily: fonts.display,
  letterSpacing: "0.02em",
  marginBottom: 3,
};
const inventoryStyle11: CSSProperties = { fontSize: 12, color: "#7A6A52", lineHeight: 1.4 };
const inventoryStyle12: CSSProperties = {
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
