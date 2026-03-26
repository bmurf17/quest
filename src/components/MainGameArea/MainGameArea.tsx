import { useGameStore } from "@/state/GameState";
import BattleEnemies from "./_BattleEnemies";
import MapNav from "./_MapNav";
import RoomChest from "./_RoomChest";
import RoomNPC from "./_RoomNPC";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import BattleOrder from "./_BattleOrder";
import RoomCamp from "./_RoomCamp";
import LevelUpModal from "./_LevelUpModal";
import GameOverModal from "./_GameOverModal";
import { GameStatus } from "@/types/GameStatus";

export default function MainGameArea() {
  const party = useGameStore((state) => state.party);
  const navigate = useNavigate();
  const gameStatus = useGameStore((state) => state.gameStatus);
  const backgroundClass =
    gameStatus === GameStatus.InTown
      ? "bg-town-background"
      : "bg-battle-background";

  useEffect(() => {
    if (party.length === 0) {
      navigate("/party");
    }
  }, [party.length, navigate]);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
      }}
      className={`bg-cover bg-center ${backgroundClass} bg-pixelated`}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
          zIndex: 10,
        }}
      >
        <div style={{ textAlign: "center", pointerEvents: "auto" }}>
          <BattleEnemies />
          <RoomChest />
          <MapNav />
          <RoomCamp />
          <BattleOrder />
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          paddingLeft: 256,
          pointerEvents: "none",
          zIndex: 20,
        }}
      >
        <div style={{ pointerEvents: "auto" }}>
          <RoomNPC />
        </div>
      </div>

      <LevelUpModal />
      <GameOverModal />
    </div>
  );
}
