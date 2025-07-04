import {
  Home,
  Plus,
  Shield
} from "lucide-react";
import { Link } from "react-router-dom";

export default function NavBar() {
  const navItems = [
    { icon: <Home size={20} />, path: "/" },
    { icon: <Plus size={20} />, path: "/create" },
    { icon: <Shield size={20} />, path: "/admin" },
  ];

  return (
    <div className="flex justify-between items-center p-2 bg-gray-800 border-b border-gray-700">
      <div className="flex items-center gap-2">
        <span className="text-blue-400">250</span>
        <span className="text-yellow-400">0</span>
      </div>
      <div className="flex gap-2">
        {navItems.map((item, i) => (
          <Link
            key={i}
            to={item.path}
            className="w-8 h-8 bg-gray-700 rounded-full hover:bg-gray-600 flex items-center justify-center text-gray-300 hover:text-white"
          >
            {item.icon}
          </Link>
        ))}
      </div>
    </div>
  );
}
