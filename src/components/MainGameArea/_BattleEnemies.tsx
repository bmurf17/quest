import { GameState, useGameStore } from "@/state/GameState";
import mushroom from "../../assets/Mushroom.png";

export default function BattleEnemies() {
  const state = useGameStore((state: GameState) => state);
  const currentRoom = state.room;
  return (
    <>
      {currentRoom && currentRoom.enemies.length > 0 ? (
        <div>
          <img
            src={mushroom}
            alt="Enemy Mushroom"
            className="mx-auto"
            style={{
              width: "128px",
              height: "128px",
              imageRendering: "pixelated",
              filter: "drop-shadow(2px 2px 4px rgba(0,0,0,0.5))",
            }}
          />
          <div className="mt-4 text-white text-lg font-bold bg-black bg-opacity-50 rounded-lg px-4 py-2 inline-block">
            Wild Mushrhum Appears!
          </div>
        </div>
      ) : (
        <> </>
      )}
    </>
  );
}
