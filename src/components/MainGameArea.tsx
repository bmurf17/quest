import { useGameStore, GameState } from "@/state/GameState";

export default function MainGameArea() {
  const room = useGameStore((state: GameState) => state.room);

  return (
    <div className="flex-1 relative bg-cover bg-center bg-battle-background overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-gray-900/75 p-2 rounded">
            {room.enemies[0].name}
          </div>
        </div>
      </div>
    </div>
  );
}
