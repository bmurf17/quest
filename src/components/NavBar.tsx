import { Link } from "react-router-dom";
import {
  Home,
  Search,
  Bell,
  Mail,
  Bookmark,
  User,
  Settings,
  Plus,
  Heart,
  Share2,
  MessageCircle,
  BarChart,
} from "lucide-react";

export default function NavBar() {
  const navItems = [
    { icon: <Home size={20} />, path: "/" },
    { icon: <Search size={20} />, path: "/search" },
    { icon: <Bell size={20} />, path: "/notifications" },
    { icon: <Mail size={20} />, path: "/messages" },
    { icon: <Bookmark size={20} />, path: "/bookmarks" },
    { icon: <User size={20} />, path: "/profile" },
    { icon: <Settings size={20} />, path: "/settings" },
    { icon: <Plus size={20} />, path: "/create" },
    { icon: <Heart size={20} />, path: "/likes" },
    { icon: <Share2 size={20} />, path: "/share" },
    { icon: <MessageCircle size={20} />, path: "/comments" },
    { icon: <BarChart size={20} />, path: "/analytics" },
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
