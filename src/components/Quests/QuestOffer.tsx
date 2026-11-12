import { Dialog, DialogContent } from "@/components/ui/dialog";
import { colors, fonts } from "@/theme";
import type { Quest } from "@/types/RoomInteractions";
import QuestDescription from "./_QuestDescription";
import { QuestPanelHeader } from "./_QuestPanelParts";
import type { CSSProperties } from "react";

export default function QuestOffer({
  isOpen = false,
  onOpenChange,
  quest,
}: {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  quest: Quest;
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 p-0" style={questOfferStyle}>
        <>
          <QuestPanelHeader title={`${quest.npcName ?? quest.name}'s Quest`} />
          <QuestDescription
            npcsName={quest.npcName ?? quest.name}
            quest={quest}
            onAccepted={() => {
              onOpenChange?.(false);
            }}
            showAcceptButton={true}
          />
        </>
      </DialogContent>
    </Dialog>
  );
}

// Static style objects hoisted out of the render path.
const questOfferStyle: CSSProperties = {
  maxWidth: 480,
  background: "linear-gradient(160deg, #0d0b07 0%, #1a1209 100%)",
  border: `1px solid ${colors.goldBorder}`,
  borderRadius: 12,
  padding: 0,
  overflow: "hidden",
  fontFamily: fonts.body,
  color: colors.text,
};
