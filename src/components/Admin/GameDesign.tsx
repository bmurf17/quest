import { Link } from "react-router-dom";

export default function Admin() {
  return (
    <main className="container mx-auto p-4">
      <h2 className="text-3xl font-bold mb-6">Admin</h2>
      <h3>Game Design</h3>

      <div className="flex flex-col">
        <Link className="text-blue-400" to="/admin/game-design/rooms">
          Rooms
        </Link>
        <Link className="text-blue-400" to="/admin/game-design/roomMap">
          Room Map
        </Link>
      </div>
    </main>
  );
}
