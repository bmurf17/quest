import { GameState, useGameStore } from "@/state/GameState";
import { useEffect, useState } from "react";
import { useSound } from "@/hooks/useSound";

export default function BattleEnemies() {
  const state = useGameStore((state: GameState) => state);
  const currentRoom = state.room;
  const lastHitEnemyId = useGameStore((state) => state.lastHitEnemyId);
  const lastHitCounter = useGameStore((state) => state.lastHitCounter);
  const isTargeting = useGameStore((state) => state.isTargeting);
  const attack = useGameStore((state) => state.attack);
  const setTargeting = useGameStore((state) => state.setTargeting);
  const [flashingEnemyId, setFlashingEnemyId] = useState<string | null>(null);
  
  const playHitSound = useSound('/sounds/hit.mp3', 0.5);

  useEffect(() => {
    if (lastHitEnemyId) {
      playHitSound();
      
      setFlashingEnemyId(lastHitEnemyId);
      const timer = setTimeout(() => {
        setFlashingEnemyId(null);
      }, 600);

      return () => clearTimeout(timer);
    }
  }, [lastHitEnemyId, lastHitCounter]); 

  const handleEnemyClick = (enemy: any) => {
    if (isTargeting) {
      attack(enemy);
      setTargeting(false);
    }
  };

  return (
    <>
      {currentRoom ? (
        <div className="flex gap-4">
          {currentRoom.enemies.map((enemy) => {
            const isFlashing = flashingEnemyId === enemy.id.toString();
            return (
              <div 
                key={enemy.id}
                onClick={() => handleEnemyClick(enemy)}
                className={isTargeting ? "cursor-crosshair" : ""}
              >
                <img
                  src={enemy.img}
                  alt={`Enemy ${enemy.name}`}
                  className={`mx-auto ${isFlashing ? "animate-flash" : ""} ${
                    isTargeting ? "hover:brightness-125 transition-all" : ""
                  }`}
                  style={{
                    width: "128px",
                    height: "128px",
                    imageRendering: "pixelated",
                    filter: isTargeting 
                      ? "drop-shadow(2px 2px 4px rgba(0,0,0,0.5)) drop-shadow(0 0 10px rgba(255,0,0,0.5))"
                      : "drop-shadow(2px 2px 4px rgba(0,0,0,0.5))",
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
      {isTargeting && currentRoom && currentRoom.enemies.length > 1 && (
        <div className="mt-4 text-yellow-400 text-sm font-bold bg-black bg-opacity-70 rounded-lg px-4 py-2">
          ⚔️ Select an enemy to attack
        </div>
      )}
    </>
  );
}