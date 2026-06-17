import { Dialog, DialogContent } from "@/components/ui/dialog";
import { colors, fonts } from "@/theme";
import { Quest } from "@/types/RoomInteractions";
import QuestDescription from "./_QuestDescription";
import { QuestPanelHeader } from "./_QuestPanelParts";

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
        <>
          <QuestPanelHeader
            title={`${(quest as any).npcName ?? quest.name}'s Quest`}
          />
          <QuestDescription
            npcsName={(quest as any).npcName ?? quest.name}
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
