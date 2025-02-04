import { useGameStore } from "@/state/GameState";

export default function Inventory() {
  const addToLog = useGameStore((state) => state.addToLog);

  return (
    <>
      <div
        className="bg-gray-900 rounded hover:bg-gray-600 cursor-pointer flex justify-center items-center"
        onClick={() => addToLog("You attacked!")}
      >
        Attack
      </div>
      <div className="bg-gray-900 rounded"></div>
      <div className="bg-gray-900 rounded"></div>
      <div className="bg-gray-900 rounded"></div>
    </>
  );
}
