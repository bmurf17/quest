import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function QuestDescription({
  isOpen = false,
  onOpenChange,
  npcsName,
}: {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  npcsName: string;
}) {
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
              Help {npcsName} find the lost treasure hidden in the ancient ruins.
            </p>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
