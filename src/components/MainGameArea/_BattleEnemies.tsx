import { GameState, useGameStore } from "@/state/GameState";
import { useEffect, useState } from "react";
import { useSound } from "@/hooks/useSound";

export default function BattleEnemies() {
  const state = useGameStore((state: GameState) => state);
  const currentRoom = state.room;
  const lastHitEnemyId = useGameStore((state) => state.lastHitEnemyId);
  const lastHitCounter = useGameStore((state) => state.lastHitCounter);
  const isTargeting = useGameStore((state) => state.isTargeting);
  const targetingSpell = useGameStore((state) => state.targetingSpell);
  const attack = useGameStore((state) => state.attack);
  const castSpell = useGameStore((state) => state.castSpell);
  const setTargeting = useGameStore((state) => state.setTargeting);
  const setTargetingSpell = useGameStore((state) => state.setTargetingSpell);
  const lastDefeatedEnemyId = useGameStore((state) => state.lastDefeatedEnemyId);
  const lastDefeatedCounter = useGameStore((state) => state.lastDefeatedCounter);
  const [flashingEnemyId, setFlashingEnemyId] = useState<string | null>(null);
  
  const playHitSound = useSound('/sounds/hit.mp3', 0.5);
  const playDefeatSound = useSound('/sounds/monster_defeat.mp3', 0.5);

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

  useEffect(() => {
    if (lastDefeatedEnemyId) {
      playDefeatSound();
    }
  }, [lastDefeatedEnemyId, lastDefeatedCounter]);

  const handleEnemyClick = (enemy: any) => {
    if (isTargeting) {
      if (targetingSpell) {
        castSpell(targetingSpell, enemy);
        setTargetingSpell(null);
      } else {
        attack(enemy);
      }
      setTargeting(false);
    }
  };

  const getTargetingMessage = () => {
    if (targetingSpell) {
      return `🔮 Select an enemy to cast ${targetingSpell.name}`;
    }
    return "⚔️ Select an enemy to attack";
  };

  const getGlowColor = () => {
    if (targetingSpell) {
      return "drop-shadow(2px 2px 4px rgba(0,0,0,0.5)) drop-shadow(0 0 10px rgba(147,51,234,0.5))";
    }
    return "drop-shadow(2px 2px 4px rgba(0,0,0,0.5)) drop-shadow(0 0 10px rgba(255,0,0,0.5))";
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
                      ? getGlowColor()
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
        <div className={`mt-4 text-sm font-bold bg-black bg-opacity-70 rounded-lg px-4 py-2 ${
          targetingSpell ? 'text-purple-400' : 'text-yellow-400'
        }`}>
          {getTargetingMessage()}
        </div>
      )}
    </>
  );
}