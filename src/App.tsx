import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { lazy, Suspense } from "react";
import GameLayout from "./components/GameLayout";
import NavBar from "./components/NavBar";
import Home from "./components/Home/Home";
import { PartySelection } from "./components/Party/PartySelection";
import { tempCleric, tempRanger, tempWarrior, tempWizard, tempAssassin, tempBarbarian, tempBard } from "./types/Character";
import { useEffect } from "react";
import { getAllRooms, getSections } from "./queries/RoomQueries";
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
  const loadSections = useGameStore(state => state.loadSections);
  const startSection = useGameStore(state => state.startSection);

  useEffect(() => {
    const loadRooms = async () => {
      try {
        console.log('Loading rooms and sections...');
        const [rooms, sections] = await Promise.all([getAllRooms(), getSections()]);
        console.log('Rooms loaded:', rooms);
        console.log('Sections loaded:', sections);
        setRooms(rooms);
        loadSections(sections);
        if (sections.length > 0) {
          console.log('Starting section:', sections[0]);
          startSection(sections[0].id, rooms);
        }
      } catch (error) {
        console.error('Failed to load rooms:', error);
      }
    };

    loadRooms();
  }, [setRooms, loadSections, startSection]);
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
