import { GameState, useGameStore } from "@/state/GameState";
import { GameStatus } from "@/types/GameStatus";
import { memo, useEffect, useLayoutEffect, useRef } from "react";
import mushroom from "/images/Mushroom.png";

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

  const keyFor = (c: any, i: number) => (c && c.id) || c.name || `idx-${i}`;

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
    return () => {
      nodeMapRef.current.forEach((el) => {
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
                  {'img' in characterOrEnemy ? (
                    <img
                      src={characterOrEnemy.img}
                      alt={characterOrEnemy.name}
                      style={{
                        width: "64px",
                        height: "64x",
                        imageRendering: "pixelated",
                        filter: "drop-shadow(2px 2px 4px rgba(0,0,0,0.5))",
                      }}
                    />
                  ) : (
                    <img
                      src={mushroom}
                      alt={(characterOrEnemy as any) + ""}
                      style={{
                        width: "64px",
                        height: "64x",
                        imageRendering: "pixelated",
                        filter: "drop-shadow(2px 2px 4px rgba(0,0,0,0.5))",
                      }}
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
