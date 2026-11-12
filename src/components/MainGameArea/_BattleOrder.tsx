import type { GameState} from "@/state/GameState";
import { useGameStore } from "@/state/GameState";
import { isEnemy } from "@/state/utils/CombatUtils";
import type { CharacterData } from "@/types/Character";
import type { Enemy } from "@/types/Enemy";
import { GameStatus } from "@/types/GameStatus";
import { memo, useEffect, useLayoutEffect, useRef } from "react";
import mushroom from "/images/Mushroom.png";
import type { CSSProperties } from "react";

function BattleOrderComponent() {
  const state = useGameStore((state: GameState) => state);

  const activeIndex = state.activeFighterIndex;
  const raw = state.combatOrder || [];
  const displayOrder = [] as { item: typeof raw[number]; originalIndex: number }[];
  const n = raw.length;
  if (n > 0) {
    for (let offset = n - 1; offset >= 1; offset--) {
      const idx = (activeIndex + offset) % n;
      displayOrder.push({ item: raw[idx], originalIndex: idx });
    }
    if (raw[activeIndex]) displayOrder.push({ item: raw[activeIndex], originalIndex: activeIndex });
  }

  const nodeMapRef = useRef(new Map<string, HTMLElement>());
  const prevRectsRef = useRef(new Map<string, DOMRect>());

  const keyFor = (c: CharacterData | Enemy | undefined, i: number) =>
    String(
      (c && "id" in c ? c.id : undefined) ?? c?.name ?? `idx-${i}`,
    );

  useLayoutEffect(() => {
    const nodeMap = nodeMapRef.current;
    const prevRects = prevRectsRef.current;

    const newRects = new Map<string, DOMRect>();
    nodeMap.forEach((el, key) => {
      if (!el) return;
      newRects.set(key, el.getBoundingClientRect());
    });

    if (prevRects.size > 0) {
      nodeMap.forEach((el, key) => {
        const prev = prevRects.get(key);
        const next = newRects.get(key);
        if (!prev || !next || !el) return;

        const deltaY = prev.top - next.top;
        const deltaX = prev.left - next.left;
        if (deltaY === 0 && deltaX === 0) return;

        el.style.transition = "none";
        el.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
        el.getBoundingClientRect();

        requestAnimationFrame(() => {
          el.style.transition = "transform 240ms ease";
          el.style.transform = "";
        });
      });
    }

    // Save new rects for next update
    prevRectsRef.current = newRects;
  }, [state.combatOrder.length, state.activeFighterIndex]);

  useEffect(() => {
    const nodeMap = nodeMapRef.current;

    return () => {
      nodeMap.forEach((el) => {
        if (el) {
          el.style.transform = "";
          el.style.transition = "";
        }
      });
    };
  }, []);

  return (
    <>
      {state.gameStatus === GameStatus.Combat ? (
        <div className="absolute bottom-4 right-4 text-white">
          <div className="flex flex-col items-center space-y-2">
            {displayOrder.map(({ item: characterOrEnemy, originalIndex }, idx) => {
              const isActive = originalIndex === state.activeFighterIndex;
              const uniqueKey = keyFor(characterOrEnemy, originalIndex ?? idx);

              return (
                <div
                  className={`p-2 ${isActive ? "border-yellow-400 border-4" : ""}`}
                  key={uniqueKey}
                  ref={(el) => {
                    if (!el) return;
                    nodeMapRef.current.set(uniqueKey, el);
                  }}
                  style={{ willChange: "transform" }}
                >
                  {isEnemy(characterOrEnemy) ? (
                    <div className="relative">
                      {characterOrEnemy.type === 'boss' && (
                        <div className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-yellow-400 z-10">
                          P{characterOrEnemy.phase ?? 1}
                        </div>
                      )}
                      <img
                        src={characterOrEnemy.img}
                        alt={characterOrEnemy.name}
                        style={battleOrderComponentStyle}
                      />
                    </div>
                  ) : (
                    <img
                      src={mushroom}
                      alt={characterOrEnemy.name}
                      style={battleOrderComponentStyle2}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <></>
      )}
    </>
  );
}

export default memo(BattleOrderComponent);

// Static style objects hoisted out of the render path.
const battleOrderComponentStyle: CSSProperties = {
  width: "64px",
  height: "64x",
  imageRendering: "pixelated",
  filter: "drop-shadow(2px 2px 4px rgba(0,0,0,0.5))",
};
const battleOrderComponentStyle2: CSSProperties = {
  width: "64px",
  height: "64x",
  imageRendering: "pixelated",
  filter: "drop-shadow(2px 2px 4px rgba(0,0,0,0.5))",
};
