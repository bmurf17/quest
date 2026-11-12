import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import GameLayout from "@/components/GameLayout";
import NavBar from "@/components/NavBar";
import Home from "@/components/Home/Home";
import { PartySelection } from "@/components/Party/PartySelection";
import { tempCleric, tempRanger, tempWarrior, tempWizard, tempAssassin, tempBarbarian, tempBard } from "@/data/fixtures/characters";
import { getAllRooms, getSections } from "@/queries/RoomQueries";
import { useGameStore } from "@/state/GameState";
import ManageRooms from "@/components/Admin/game-design/CreateRoom";
import RoomMap from "@/components/Admin/game-design/RoomMap";
import ManageSections from "@/components/Admin/game-design/ManageSections";
import ManageDialogues from "@/components/Admin/game-design/ManageDialogues";
import { PartyManagement } from "@/components/Party/PartyManagement";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { logger } from "@/lib/logger";

const CharacterCreation = lazy(() => import("@/components/CharacterCreation/CharacterCreation"));
const Admin = lazy(() => import("@/components/Admin/GameDesign"));

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
    </div>
  );
}

function GameLoadError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-md space-y-4 rounded-xl border border-gold-dark/30 bg-[#14110a] p-6 text-center">
        <h2 className="font-display text-xl text-gold">
          The realm could not be loaded
        </h2>
        <p className="text-sm text-text-muted">
          {message}
        </p>
        <p className="text-xs text-muted">
          Check your connection and Supabase configuration, then try again.
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="rounded-md border border-gold-dark/40 bg-gold/10 px-4 py-2 text-sm font-semibold text-gold transition-colors hover:bg-gold/20"
        >
          Retry
        </button>
      </div>
    </div>
  );
}

function App() {
  const setRooms = useGameStore(state => state.setRooms);
  const loadSections = useGameStore(state => state.loadSections);
  const startSection = useGameStore(state => state.startSection);
  const preloadDialogueTrees = useGameStore(state => state.preloadDialogueTrees);
  const loadCutscenes = useGameStore(state => state.loadCutscenes);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const loadGameData = async () => {
      setLoadError(null);
      try {
        const [rooms, sections] = await Promise.all([getAllRooms(), getSections()]);
        if (cancelled) return;

        setRooms(rooms);
        preloadDialogueTrees(rooms);
        loadSections(sections);

        const cutsceneRes = await fetch("/data/cutscenes.json");
        if (!cutsceneRes.ok) {
          throw new Error(
            `Failed to load cutscenes (${cutsceneRes.status} ${cutsceneRes.statusText})`,
          );
        }
        const cutsceneData = await cutsceneRes.json();
        if (cancelled) return;

        loadCutscenes(cutsceneData);
        if (sections.length > 0) {
          startSection(sections[0].id, rooms);
        }
      } catch (error) {
        if (cancelled) return;
        logger.error("Failed to load game data:", error);
        setLoadError(
          error instanceof Error && error.message
            ? error.message
            : "An unexpected error occurred while loading the game.",
        );
      }
    };

    loadGameData();

    return () => {
      cancelled = true;
    };
  }, [setRooms, loadSections, startSection, preloadDialogueTrees, loadCutscenes, loadAttempt]);

  const handleRetry = useCallback(() => {
    setLoadError(null);
    setLoadAttempt(attempt => attempt + 1);
  }, []);

  return (
    <Router>
      <div className="flex flex-col h-screen bg-gray-900 text-white">
        <NavBar />
        <ErrorBoundary>
          {loadError ? (
            <GameLoadError message={loadError} onRetry={handleRetry} />
          ) : (
            <Suspense fallback={<LoadingSpinner />}>
              <Routes>
                <Route path={"/"} element={<Home />} />
                <Route path={"/game"} element={<GameLayout />} />
                <Route path={"/party-selection"} element={<PartySelection availableCharacters={[tempRanger, tempWarrior, tempCleric, tempWizard, tempAssassin, tempBarbarian, tempBard]} />} />
                <Route path={"/party"} element={<PartyManagement />} />
                <Route path={"/create"} element={<CharacterCreation />} />
                <Route path={"/admin/game-design/rooms"} element={<ManageRooms />} />
                <Route path={"/admin/game-design/roomMap"} element={<RoomMap />} />
                <Route path={"/admin/game-design/sections"} element={<ManageSections />} />
                <Route path={"/admin/game-design/dialogues"} element={<ManageDialogues />} />
                <Route path={"/admin"} element={<Admin />} />
              </Routes>
            </Suspense>
          )}
        </ErrorBoundary>
      </div>
    </Router>
  );
}

export default App;
