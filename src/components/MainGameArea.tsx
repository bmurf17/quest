import { useGameStore, GameState } from "@/state/GameState";
import { Directions } from "@/types/Directions";
import { GameStatus } from "@/types/GameStatus";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
} from "lucide-react";
import mushroom from "../assets/Mushroom.png";

export default function MainGameArea() {
  const state = useGameStore((state: GameState) => state);
  const currentRoom = state.room;

  return (
    <div className="flex-1 relative bg-cover bg-center bg-battle-background overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
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
            <div className="text-white text-xl font-bold bg-black bg-opacity-80 rounded-lg px-6 py-3 inline-block">
              Enemy defeated!
            </div>
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
