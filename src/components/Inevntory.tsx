import { useGameStore } from "@/state/GameState";

export default function Inventory() {
  // Select the attack function directly without calling it
  const attack = useGameStore((state) => state.attack);
  const room = useGameStore((state) => state.room);

  return (
    <>
      <div
        className="bg-gray-900 rounded hover:bg-gray-600 cursor-pointer flex justify-center items-center"
        onClick={() => attack(room.enemies[0])}
      >
        Attack
      </div>
      <div className="bg-gray-900 rounded"></div>
      <div className="bg-gray-900 rounded"></div>
      <div className="bg-gray-900 rounded"></div>
    </>
  );
}
