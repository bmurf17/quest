import { GameState, useGameStore } from "@/state/GameState";
import { GameStatus } from "@/types/GameStatus";
import mushroom from "../../assets/Mushroom.png";

export default function BattleOrder() {
  const state = useGameStore((state: GameState) => state);

  console.log(state.combatOrder);

  return (
    <>
      {state.gameStatus === GameStatus.Combat ? (
        <div className="absolute bottom-4 right-4 text-white">
          <div className="flex flex-col items-center space-y-2">
            {state.combatOrder.map((characterOrEnemy, i) => {
              return (
                <div className="border-yellow-400 border-4 p-2" key={i}>
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
                      alt={characterOrEnemy.name}
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
