import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Quest } from "@/types/RoomInteractions";

export default function QuestDescription({
  isOpen = false,
  onOpenChange,
  npcsName,
  quest
}: {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  npcsName: string;
  quest: Quest;
}) {
   console.log("Rendering QuestDescription with quest:", quest);
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl bg-gray-800 text-white">
        <DialogHeader className="mt-4">
          <DialogTitle className="text-xl font-bold flex items-center justify-between">
            <span>{npcsName}'s Quest</span>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[80vh] pr-4">
          <div className="flex flex-col">
            <p className="text-lg font-bold">Quest Description</p>
            <p className="mt-2">
              Help {npcsName} {quest.description}
            </p>
            <p className="mt-2">
              Quest Objectives:
            </p>
            <ul className="list-disc list-inside">
              {quest.objectives.map((objective, index) => (
                <li key={index}>{objective}</li>
              ))}
            </ul>
            <p className="mt-2">
              Quest Rewards:
            </p>
            {quest.type.type === "defeat" ? (
              <p className="mt-2">
                Defeat <span className="font-bold text-yellow-400">{quest.type.enemy.name}</span> to complete the quest.
              </p>
            ) : (<></>)}

            <ul className="list-disc list-inside">
              {quest.rewards.map((reward, index) => (
                <li key={index}>{reward.name}</li>
              ))}
            </ul>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
