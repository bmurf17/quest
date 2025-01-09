import React from "react";
import { GameState, useGameStore } from "../state/GameState";
import Party from "./Party";
import Inventory from "./Inevntory";
import MainGameArea from "./MainGameArea";
import ActivityLog from "./ActivityLog";

export default function GameLayout() {
  const activityLog = useGameStore((state: GameState) => state.activityLog);
  const party = useGameStore((state: GameState) => state.party);

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      {/* Top Bar */}
      <div className="flex justify-between items-center p-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <span className="text-blue-400">250</span>
          <span className="text-yellow-400">0</span>
        </div>
        <div className="flex gap-2">
          {Array.from({ length: 12 }).map((_, i) => (
            <button
              key={i}
              className="w-8 h-8 bg-gray-700 rounded-full hover:bg-gray-600"
            >
              {/* Icon placeholders */}
            </button>
          ))}
        </div>
      </div>
      <MainGameArea />

      {/* Bottom Control Panel */}
      <div className="h-64 bg-gray-800 border-t border-gray-700 grid grid-cols-12 gap-2 p-2">
        <ActivityLog activityLog={activityLog} />

        <div className="col-span-4 flex flex-col gap-2">
          <Party party={party} />
        </div>

        <div className="col-span-4 grid grid-cols-4 gap-2">
          <Inventory />
        </div>
      </div>
    </div>
  );
}
