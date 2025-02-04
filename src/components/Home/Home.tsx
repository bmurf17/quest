import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="flex flex-col gap-16 justify-center items-center h-full">
      <Link to="/game">
        <h2 className="cursor-pointer hover:text-red-400">Start New Game</h2>
      </Link>
      <h2>Settings</h2>
    </div>
  );
}
