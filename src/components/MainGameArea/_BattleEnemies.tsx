import { GameState, useGameStore } from "@/state/GameState";
import { useEffect, useState } from "react";

export default function BattleEnemies() {
  const state = useGameStore((state: GameState) => state);
  const currentRoom = state.room;
  const lastHitEnemyId = useGameStore((state) => state.lastHitEnemyId);
  const lastHitCounter = useGameStore((state) => state.lastHitCounter);
  const [flashingEnemyId, setFlashingEnemyId] = useState<string | null>(null);

  useEffect(() => {
    if (lastHitEnemyId) {
      setFlashingEnemyId(lastHitEnemyId);
      const timer = setTimeout(() => {
        setFlashingEnemyId(null);
      }, 600);

      return () => clearTimeout(timer);
    }
  }, [lastHitEnemyId, lastHitCounter]);

  return (
    <>
      {currentRoom ? (
        <div className="flex gap-4">
          {currentRoom.enemies.map((enemy) => {
            const isFlashing = flashingEnemyId === enemy.id.toString();
            return (
              <div key={enemy.id}>
                <img
                  src={enemy.img}
                  alt={`Enemy ${enemy.name}`}
                  className={`mx-auto ${isFlashing ? "animate-flash" : ""}`}
                  style={{
                    width: "128px",
                    height: "128px",
                    imageRendering: "pixelated",
                    filter: "drop-shadow(2px 2px 4px rgba(0,0,0,0.5))",
                  }}
                />
                <div className="mt-4 text-white text-lg font-bold bg-black bg-opacity-50 rounded-lg px-4 py-2 inline-block">
                  {enemy.name} Appears!
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <> </>
      )}
    </>
  );
}