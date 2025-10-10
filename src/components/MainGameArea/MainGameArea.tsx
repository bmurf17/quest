import { useGameStore } from "@/state/GameState";
import BattleEnemies from "./_BattleEnemies";
import MapNav from "./_MapNav";
import RoomChest from "./_RoomChest";
import RoomNPC from "./_RoomNPC";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

export default function MainGameArea() {
  const party = useGameStore((state) => state.party);
  const navigate = useNavigate();

  useEffect(() => {
    if (party.length === 0) {
      navigate("/party");
    }
  }, [party.length, navigate]);
  return (
    <div className="flex-1 relative bg-cover bg-center bg-battle-background overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <BattleEnemies />
          <RoomNPC />
          <RoomChest />
          <MapNav />
        </div>
      </div>
    </div>
  );
}
