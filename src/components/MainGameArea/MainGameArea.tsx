import { useGameStore } from "@/state/GameState";
import BattleEnemies from "./_BattleEnemies";
import MapNav from "./_MapNav";
import RoomChest from "./_RoomChest";
import RoomNPC from "./_RoomNPC";
import { useNavigate } from "react-router-dom";
import { useEffect, useCallback } from "react";
import BattleOrder from "./_BattleOrder";
import RoomCamp from "./_RoomCamp";
import LevelUpModal from "./_LevelUpModal";
import GameOverModal from "./_GameOverModal";
import { GameStatus } from "@/types/GameStatus";
import CutsceneOverlay from "./_CutsceneOverlay";
import TavernOverlay from "./_TavernOverlay";

export default function MainGameArea() {
  const party = useGameStore((state) => state.party);
  const navigate = useNavigate();
  const gameStatus = useGameStore((state) => state.gameStatus);
  const room = useGameStore((state) => state.room);
  const activeCutscene = useGameStore((state) => state.activeCutscene);
  const playCutscene = useGameStore((state) => state.playCutscene);
  const advanceCutsceneScene = useGameStore(
    (state) => state.advanceCutsceneScene,
  );

  const backgroundClass =
    gameStatus === GameStatus.InTown
      ? "bg-town-background"
      : "bg-battle-background";

  useEffect(() => {
    if (party.length === 0) {
      navigate("/party");
    }
  }, [party.length, navigate]);

  useEffect(() => {
    if (room.interaction?.type === "cutscene") {
      playCutscene(room.interaction.cutscene.cutsceneId);
    }
  }, [room.id, playCutscene]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (
        activeCutscene &&
        (e.key === "Enter" || e.key === " " || e.key === "Escape")
      ) {
        e.preventDefault();
        advanceCutsceneScene();
      }
    },
    [activeCutscene, advanceCutsceneScene],
  );

  useEffect(() => {
    if (activeCutscene) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [activeCutscene, handleKeyDown]);

  if (activeCutscene) {
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
        <CutsceneOverlay />
      </div>
    );
  }

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
             <TavernOverlay />
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
