import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { lazy, Suspense } from "react";
import GameLayout from "./components/GameLayout";
import NavBar from "./components/NavBar";
import Home from "./components/Home/Home";
import { PartySelection } from "./components/Party/PartySelection";
import { tempCleric, tempRanger, tempWarrior, tempWizard, tempAssassin, tempBarbarian, tempBard } from "./types/Character";
import { useEffect } from "react";
import { getAllRooms } from "./queries/RoomQueries";
import { useGameStore } from "./state/GameState";
import ManageRooms from "./components/Admin/game-design/CreateRoom";
import RoomMap from "./components/Admin/game-design/RoomMap";

const CharacterCreation = lazy(() => import("./components/CharacterCreation/CharacterCreation"));
const Admin = lazy(() => import("./components/Admin/GameDesign"));

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
    </div>
  );
}

function App() {
  const setRooms = useGameStore(state => state.setRooms);

  useEffect(() => {
    const loadRooms = async () => {
      try {
        const rooms = await getAllRooms();
        setRooms(rooms);
      } catch (error) {
        console.error('Failed to load rooms:', error);
      }
    };

    loadRooms();
  }, [setRooms]);
  return (
    <Router>
      <div className="flex flex-col h-screen bg-gray-900 text-white">
        <NavBar />
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path={"/"} element={<Home />} />
            <Route path={"/game"} element={<GameLayout />} />
            <Route path={"/party"} element={<PartySelection availableCharacters={[tempRanger, tempWarrior, tempCleric, tempWizard, tempAssassin, tempBarbarian, tempBard]} />} />
            <Route path={"/create"} element={<CharacterCreation />} />
            <Route path={"/admin/game-design/rooms"} element={<ManageRooms />} />
            <Route path={"/admin/game-design/roomMap"} element={<RoomMap />} />
            <Route path={"/admin"} element={<Admin />} />
          </Routes>
        </Suspense>
      </div>
    </Router>
  );
}

export default App;
