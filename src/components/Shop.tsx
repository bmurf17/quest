import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useGameStore } from "@/state/GameState";
import type { Item } from "@/types/Item";

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
      <DialogContent className="max-w-xl bg-gray-800 text-white">
        <DialogHeader className="mt-4">
          <DialogTitle className="text-xl font-bold flex items-center justify-between">
            <span>{ownersName}'s Shop</span>
            <span className="text-yellow-400 text-lg">💰 {goldPieces} GP</span>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[80vh] pr-4">
          <div className="flex flex-col">
            {inventory.map((item) => {
              return (
                <button
                  type="button"
                  className={`flex gap-4 items-center w-full text-left bg-transparent border-0 p-0 ${
                    item.cost > goldPieces
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:cursor-pointer hover:bg-gray-600"
                  }`}
                  key={item.name}
                  onClick={() => buyItem(item)}
                  disabled={item.cost > goldPieces}
                  aria-label={`Buy ${item.name} for ${item.cost} GP`}
                >
                  <img
                    src={item.img}
                    alt={item.name}
                    className="w-32 h-32 rounded bg-gray-700"
                    style={{
                      imageRendering: "pixelated",
                      opacity: item.cost > goldPieces ? 0.4 : 1,
                      filter:
                        item.cost > goldPieces ? "grayscale(100%)" : "none",
                    }}
                  />
                  <div className="flex flex-col">
                    <p className="text-xl">{item.name}</p>{" "}
                    <p className="text-xl text-yellow-400">{item.cost} GP</p>
                  </div>
                </button>
              );
            })}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
