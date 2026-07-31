import { Bug, Home, Plus, Shield, Users } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import DevPanel from "./DevPanel";

export default function NavBar() {
  const location = useLocation();
  const [devOpen, setDevOpen] = useState(false);

  const navItems = [
    { icon: <Home size={16} />, path: "/", label: "Home" },
    { icon: <Plus size={16} />, path: "/create", label: "Create" },
    { icon: <Users size={16} />, path: "/party", label: "Party" },
    { icon: <Shield size={16} />, path: "/admin", label: "Admin" },
  ];

  return (
    <>
      <nav className="flex items-center justify-between px-5 h-[52px] bg-[rgba(10,9,6,0.95)] border-b border-gold-dark/20 backdrop-blur-sm shrink-0 relative z-[100]">
        <Link to="/" className="no-underline flex items-center gap-2">
          <div className="w-6 h-6 bg-gold-muted/15 border border-gold-dark/20 rounded flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth={1.5} width={14} height={14}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
            </svg>
          </div>
          <span className="text-sm font-bold text-gold-muted font-display tracking-[0.08em]">
            Qwest
          </span>
        </Link>

        <div className="flex gap-1.5 items-center">
          <div className="w-[3px] h-[3px] rounded-full bg-gold-dark/15" />
          <div className="w-[3px] h-[3px] rounded-full bg-gold-dark/30" />
          <div className="w-[3px] h-[3px] rounded-full bg-gold-dark/15" />
        </div>

        <div className="flex gap-1 items-center">
          {navItems.map((item, i) => {
            const active = location.pathname === item.path ||
              (item.path !== "/" && location.pathname.startsWith(item.path));
            return (
              <Link
                key={i}
                to={item.path}
                className="no-underline flex flex-col items-center gap-0.5 px-1.5 py-1"
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center relative transition-colors duration-150 ${
                    active
                      ? "border border-gold/50 bg-gold/15 text-gold"
                      : "border border-subtle bg-transparent text-muted"
                  }`}
                >
                  {item.icon}
                </div>
              </Link>
            );
          })}

          <button
            onClick={() => setDevOpen((o) => !o)}
            className="no-underline flex flex-col items-center gap-0.5 px-1.5 py-1 bg-none border-none cursor-pointer"
          >
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-150 ${
                devOpen
                  ? "border border-gold/50 bg-gold/15 text-gold"
                  : "border border-subtle bg-transparent text-muted"
              }`}
            >
              <Bug size={16} />
            </div>
          </button>
        </div>
      </nav>

      {devOpen && <DevPanel />}
    </>
  );
}
