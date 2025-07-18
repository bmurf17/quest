import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import GameLayout from "./components/GameLayout";
import NavBar from "./components/NavBar";
import Home from "./components/Home/Home";
import CharacterCreation from "./components/CharacterCreation/CharacterCreation";
import ManageRooms from "./components/Admin/game-design/CreateRoom";
import Admin from "./components/Admin/GameDesign";
import RoomMap from "./components/Admin/game-design/RoomMap";

function App() {
  return (
    <Router>
      <div className="flex flex-col h-screen bg-gray-900 text-white">
        <NavBar />
        <Routes>
          <Route path={"/"} element={<Home />} />
          <Route path={"/game"} element={<GameLayout />} />
          <Route path={"/create"} element={<CharacterCreation />} />
          <Route path={"/admin/game-design/rooms"} element={<ManageRooms />} />
          <Route path={"/admin/game-design/roomMap"} element={<RoomMap />} />
          <Route path={"/admin"} element={<Admin />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
