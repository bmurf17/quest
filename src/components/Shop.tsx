import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useGameStore } from "@/state/GameState";
import { Item } from "@/types/Item";

export default function Shop({
  isOpen = false,
  onOpenChange,
  inventory,
  ownersName
}: {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  inventory: Item[];
  ownersName: string;
}) {
  const buyItem = useGameStore((state) => state.buyItem);
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl bg-gray-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">{ownersName}'s Shop</DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[80vh] pr-4">
          <div className="flex flex-col">
            {inventory.map((item) => {
              return (
                <div
                  className="flex gap-4 items-center hover:cursor-pointer hover:bg-gray-600"
                  key={item.name}
                  onClick={() => buyItem(item)}
                >
                  <img
                    src={item.img}
                    alt={item.name}
                    className="w-32 h-32 rounded bg-gray-700"
                    style={{
                      imageRendering: "pixelated",
                    }}
                  />
                  <div className="flex flex-col">
                    <p className="text-xl">{item.name}</p>{" "}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
