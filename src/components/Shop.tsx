import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useGameStore } from "@/state/GameState";
import { colors, fonts } from "@/theme";
import type { Item } from "@/types/Item";
import type { CSSProperties } from "react";

export default function Shop({
  isOpen = false,
  onOpenChange,
  inventory,
  ownersName,
}: {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  inventory: Item[];
  ownersName: string;
}) {
  const buyItem = useGameStore((state) => state.buyItem);
  const goldPieces = useGameStore((state) => state.goldPieces);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent style={shopStyle}>
        <DialogHeader style={shopHeaderStyle}>
          <div style={shopHeaderRowStyle}>
            <DialogTitle style={shopTitleStyle}>{ownersName}'s Shop</DialogTitle>
            <span style={shopGoldStyle}>💰 {goldPieces} GP</span>
          </div>
        </DialogHeader>

        <ScrollArea style={{ height: "60vh" }}>
          <div style={shopListStyle}>
            {inventory.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 16px" }}>
                <div style={shopEmptyIconStyle}>◇</div>
                <p style={shopEmptyTextStyle}>This shop has nothing for sale</p>
              </div>
            ) : (
              inventory.map((item) => {
                const canAfford = item.cost <= goldPieces;

                return (
                  <button
                    type="button"
                    key={item.name}
                    onClick={() => buyItem(item)}
                    disabled={!canAfford}
                    aria-label={`Buy ${item.name} for ${item.cost} GP`}
                    style={{
                      ...shopItemStyle,
                      opacity: canAfford ? 1 : 0.55,
                      cursor: canAfford ? "pointer" : "not-allowed",
                    }}
                    onMouseEnter={(e) => {
                      if (!canAfford) return;
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
                      if (canAfford) e.currentTarget.style.transform = "scale(0.99)";
                    }}
                    onMouseUp={(e) => {
                      e.currentTarget.style.transform = canAfford ? "translateX(2px)" : "none";
                    }}
                  >
                    <div style={shopIconStyle}>
                      <img
                        src={item.img}
                        alt={item.name}
                        style={{
                          ...shopItemImgStyle,
                          filter: canAfford
                            ? "drop-shadow(0 2px 4px rgba(0,0,0,0.7))"
                            : "grayscale(100%) drop-shadow(0 2px 4px rgba(0,0,0,0.7))",
                        }}
                      />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={shopItemNameStyle}>{item.name}</div>
                      {item.description && (
                        <div style={shopItemDescriptionStyle}>{item.description}</div>
                      )}
                      <div style={shopItemPriceStyle}>{item.cost} GP</div>
                    </div>

                    <div
                      style={{
                        ...shopBuyStyle,
                        color: canAfford ? colors.goldMuted : colors.muted,
                        borderColor: canAfford ? colors.goldBorder : colors.subtleBorder,
                      }}
                    >
                      {canAfford ? "Buy" : "Too costly"}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

// Static style objects hoisted out of the render path.
const shopStyle: CSSProperties = {
  maxWidth: 480,
  background: "linear-gradient(160deg, #0d0b07 0%, #1a1209 100%)",
  border: `1px solid ${colors.goldBorder}`,
  borderRadius: 12,
  padding: 0,
  overflow: "hidden",
  fontFamily: fonts.body,
  color: colors.text,
};
const shopHeaderStyle: CSSProperties = {
  padding: "18px 46px 14px 22px",
  borderBottom: "1px solid rgba(180,140,80,0.12)",
};
const shopHeaderRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
};
const shopTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: 16,
  fontWeight: 700,
  color: colors.goldMuted,
  fontFamily: fonts.display,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
};
const shopGoldStyle: CSSProperties = {
  flexShrink: 0,
  fontSize: 13,
  fontWeight: 700,
  color: "#F5D76E",
  fontFamily: fonts.display,
  letterSpacing: "0.03em",
};
const shopListStyle: CSSProperties = {
  padding: "10px 14px 20px",
  display: "flex",
  flexDirection: "column",
  gap: 6,
};
const shopEmptyIconStyle: CSSProperties = { fontSize: 28, opacity: 0.15, marginBottom: 10 };
const shopEmptyTextStyle: CSSProperties = {
  margin: 0,
  color: colors.muted,
  fontSize: 13,
  fontFamily: fonts.display,
};
const shopItemStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 14,
  padding: "10px 12px",
  background: "rgba(255,255,255,0.025)",
  border: "1px solid rgba(180,140,80,0.14)",
  borderRadius: 7,
  font: "inherit",
  textAlign: "left",
  width: "100%",
  transition: "background 0.15s, border-color 0.15s, transform 0.1s",
};
const shopIconStyle: CSSProperties = {
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
const shopItemImgStyle: CSSProperties = {
  width: 36,
  height: 36,
  imageRendering: "pixelated",
};
const shopItemNameStyle: CSSProperties = {
  fontSize: 14,
  fontWeight: 700,
  color: colors.text,
  fontFamily: fonts.display,
  letterSpacing: "0.02em",
  marginBottom: 3,
};
const shopItemDescriptionStyle: CSSProperties = {
  fontSize: 12,
  color: "#7A6A52",
  lineHeight: 1.4,
  marginBottom: 3,
};
const shopItemPriceStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  color: "#F5D76E",
  fontFamily: fonts.display,
  letterSpacing: "0.03em",
};
const shopBuyStyle: CSSProperties = {
  flexShrink: 0,
  fontSize: 10,
  fontFamily: fonts.display,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  border: `1px solid ${colors.goldBorder}`,
  borderRadius: 4,
  padding: "3px 8px",
};
