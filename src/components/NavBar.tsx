import { Home, Plus, Shield, Users } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { colors, fonts } from "../theme";

export default function NavBar() {
  const location = useLocation();

  const navItems = [
    { icon: <Home size={16} />, path: "/", label: "Home" },
    { icon: <Plus size={16} />, path: "/create", label: "Create" },
    { icon: <Users size={16} />, path: "/party", label: "Party" },
    { icon: <Shield size={16} />, path: "/admin", label: "Admin" },
  ];

  return (
    <>
      <style>{`
        .nav-link { transition: color 0.15s, background 0.15s, border-color 0.15s; }
        .nav-link:hover .nav-icon-wrap { border-color: rgba(212,175,55,0.5) !important; background: rgba(212,175,55,0.1) !important; color: #D4AF37 !important; }
        .nav-link:hover .nav-label { color: #C9A84C !important; }
      `}</style>

      <nav style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 20px",
        height: 52,
        background: "rgba(10,9,6,0.95)",
        borderBottom: "1px solid rgba(180,140,80,0.15)",
        backdropFilter: "blur(8px)",
        flexShrink: 0,
        position: "relative",
        zIndex: 100,
      }}>

        <Link to="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 24, height: 24,
            background: "rgba(212,175,55,0.12)",
            border: "1px solid rgba(212,175,55,0.3)",
            borderRadius: 5,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth={1.5} width={14} height={14}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
            </svg>
          </div>
          <span style={{
            fontSize: 14,
            fontWeight: 700,
            color: colors.goldMuted,
            fontFamily: fonts.display,
            letterSpacing: "0.08em",
          }}>
            Qwest
          </span>
        </Link>

        <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
          {[0.15, 0.3, 0.15].map((o, i) => (
            <div key={i} style={{ width: 3, height: 3, background: `rgba(180,140,80,${o})`, borderRadius: "50%" }} />
          ))}
        </div>

        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          {navItems.map((item, i) => {
            const active = location.pathname === item.path ||
              (item.path !== "/" && location.pathname.startsWith(item.path));
            return (
              <Link
                key={i}
                to={item.path}
                className="nav-link"
                style={{ textDecoration: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: "4px 6px" }}
              >
                <div
                  className="nav-icon-wrap"
                  style={{
                    width: 32, height: 32,
                    borderRadius: 7,
                    border: `1px solid ${active ? "rgba(212,175,55,0.5)" : colors.subtleBorder}`,
                    background: active ? "rgba(212,175,55,0.12)" : "transparent",
                    color: active ? colors.gold : colors.muted,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    position: "relative",
                  }}
                >
                  {item.icon}
                </div>
              </Link>
            );
          })}
        </div>

      </nav>
    </>
  );
}