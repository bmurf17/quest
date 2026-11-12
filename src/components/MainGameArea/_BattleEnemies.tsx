import { getEnemyMaxHealth } from "@/state/utils/CombatUtils";
import type { GameState} from "@/state/GameState";
import { useGameStore } from "@/state/GameState";
import type { Enemy } from "@/types/Enemy";
import { useEffect, useState, memo } from "react";
import { useSound } from "@/hooks/useSound";

function BattleEnemiesComponent() {
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
  }, [lastHitEnemyId, lastHitCounter, playHitSound]);

  useEffect(() => {
    if (lastDefeatedEnemyId) {
      playDefeatSound();
    }
  }, [lastDefeatedEnemyId, lastDefeatedCounter, playDefeatSound]);

  const handleEnemyClick = (enemy: Enemy) => {
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

  const getEnemyHealthColor = (hp: number, maxHp: number) => {
    const pct = hp / maxHp;
    if (pct > 0.6) return 'bg-green-500';
    if (pct > 0.3) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <>
      {currentRoom ? (
        <div className="flex gap-4 items-start">
          {currentRoom.enemies.map((enemy) => {
            const isFlashing = flashingEnemyId === enemy.id.toString();
            const isBoss = enemy.type === 'boss';
            const maxHp = getEnemyMaxHealth(enemy);
            const hpPct = enemy.health / maxHp;
            const imgSize = isBoss ? 160 : 128;

            return (
              <button
                type="button"
                key={enemy.id}
                onClick={() => handleEnemyClick(enemy)}
                disabled={!isTargeting}
                aria-label={`${targetingSpell ? "Cast on" : "Attack"} ${enemy.name}`}
                className={`flex flex-col items-center border-0 bg-transparent p-0 font-[inherit] ${
                  isTargeting ? "cursor-crosshair" : "cursor-default"
                }`}
              >
                <div className="relative">
                  <img
                    src={enemy.img}
                    alt={`Enemy ${enemy.name}`}
                    className={`mx-auto ${isFlashing ? "animate-flash" : ""} ${
                      isTargeting ? "hover:brightness-125 transition-all" : ""
                    }`}
                    style={{
                      width: `${imgSize}px`,
                      height: `${imgSize}px`,
                      imageRendering: "pixelated",
                      filter: isTargeting
                        ? getGlowColor()
                        : "drop-shadow(2px 2px 4px rgba(0,0,0,0.5))",
                    }}
                  />
                  {isBoss && (
                    <div className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full border border-yellow-400">
                      P{enemy.phase ?? 1}
                    </div>
                  )}
                </div>

                <div className="mt-2 w-32">
                  <div className="flex justify-between text-xs text-white mb-0.5">
                    <span className="font-bold truncate max-w-[80px]">{enemy.name}</span>
                    <span>{Math.ceil(enemy.health)}/{maxHp}</span>
                  </div>
                  <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${getEnemyHealthColor(enemy.health, maxHp)} transition-all duration-300`}
                      style={{ width: `${hpPct * 100}%` }}
                    />
                  </div>
                </div>
              </button>
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

export default memo(BattleEnemiesComponent);