import { useGameStore, GameState } from "@/state/GameState";
import { Directions } from "@/types/Directions";
import { GameStatus } from "@/types/GameStatus";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
} from "lucide-react";

export default function MainGameArea() {
  const state = useGameStore((state: GameState) => state);

  const roomInstance = state.roomInstances.get(state.room);
  console.log(roomInstance);

  return (
    <div className="flex-1 relative bg-cover bg-center bg-battle-background overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          {roomInstance && roomInstance?.enemies.length > 0 ? (
            <div className="bg-gray-900/75 p-2 rounded">
              {roomInstance.enemies[0].name}
            </div>
          ) : (
            <>Enemy defeated</>
          )}
        </div>
      </div>

      {state.gameStatus === GameStatus.Exploring ? (
        <div className="absolute bottom-4 left-4 text-white">
          <div className="flex flex-col items-center space-y-2">
            <button
              onClick={() => {
                state.move(Directions.North);
              }}
              className="p-3 bg-gray-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 active:scale-95 disabled:hover:bg-gray-700 disabled:bg-gray-700"
              disabled={
                !state.room.neighboringRooms.some(
                  ([direction]) => direction === Directions.North
                )
              }
            >
              <ChevronUp size={24} />
            </button>

            <div className="flex space-x-2">
              <button
                onClick={() => {
                  state.move(Directions.West);
                }}
                className="p-3 bg-gray-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 active:scale-95 disabled:hover:bg-gray-700 disabled:bg-gray-700"
                disabled={
                  !state.room.neighboringRooms.some(
                    ([direction]) => direction === Directions.West
                  )
                }
              >
                <ChevronLeft size={24} />
              </button>

              <button
                onClick={() => state.move(Directions.East)}
                className="p-3 bg-gray-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 active:scale-95 disabled:hover:bg-gray-700 disabled:bg-gray-700"
                disabled={
                  !state.room.neighboringRooms.some(
                    ([direction]) => direction === Directions.East
                  )
                }
              >
                <ChevronRight size={24} />
              </button>
            </div>

            <button
              onClick={() => state.move(Directions.South)}
              className="p-3 bg-gray-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 active:scale-95 disabled:hover:bg-gray-700 disabled:bg-gray-700"
              disabled={
                !state.room.neighboringRooms.some(
                  ([direction]) => direction === Directions.South
                )
              }
            >
              <ChevronDown size={24} />
            </button>
          </div>
        </div>
      ) : (
        <></>
      )}
    </div>
  );
}
