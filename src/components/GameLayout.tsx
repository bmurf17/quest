import { GameState, useGameStore } from "../state/GameState";
import Party from "./Party";
import ActionMenu from "./ActionMenu";
import MainGameArea from "./MainGameArea/MainGameArea";
import ActivityLog from "./ActivityLog";

export default function GameLayout() {
  const activityLog = useGameStore((state: GameState) => state.activityLog);
  const party = useGameStore((state: GameState) => state.party);

  return (
    <>
      <MainGameArea />

      <div className="h-96 bg-gray-800 border-t border-gray-700 grid grid-cols-12 gap-2 p-2">
        <ActivityLog activityLog={activityLog} />

        <div className="col-span-4 flex flex-col gap-2">
          <Party party={party} />
        </div>

        <div className="col-span-4 grid grid-cols-4 gap-2">
          <ActionMenu />
        </div>
      </div>
    </>
  );
}
