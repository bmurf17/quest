import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import GameLayout from "./components/GameLayout";
import NavBar from "./components/NavBar";
import Home from "./components/Home/Home";
import CharacterCreation from "./components/CharacterCreation/CharacterCreation";

function App() {
  return (
    <Router>
      <div className="flex flex-col h-screen bg-gray-900 text-white">
        <NavBar />
        <Routes>
          <Route path={"/"} element={<Home />} />
          <Route path={"/game"} element={<GameLayout />} />
          <Route path={"/create"} element={<CharacterCreation />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
