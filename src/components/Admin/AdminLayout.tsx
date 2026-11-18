import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { ArrowLeft, Search } from "lucide-react";
import { colors, fonts } from "@/theme";
import { adminBreadcrumbs, adminNavItems } from "./adminNav";
import { AdminSearchPalette } from "./ui/AdminSearchPalette";

export function AdminLayout() {
  const location = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  const crumbs = adminBreadcrumbs(location.pathname);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen((open) => !open);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div
      className="flex h-[calc(100vh-52px)] flex-col overflow-hidden md:flex-row"
      style={{ background: "linear-gradient(160deg, #0d0b07 0%, #1a1209 50%, #0f0e09 100%)" }}
    >
      <aside
        className="flex shrink-0 flex-row items-center border-b md:w-16 md:flex-col md:border-b-0 md:border-r"
        style={{ borderColor: colors.goldBorder, background: "rgba(10,9,6,0.55)" }}
      >
        <div
          className="hidden h-14 w-full items-center justify-center border-b md:flex"
          style={{ borderColor: colors.subtleBorder }}
          title="Admin console"
        >
          <span
            style={{
              fontFamily: fonts.display,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: colors.goldMuted,
              writingMode: "vertical-rl",
              transform: "rotate(180deg)",
            }}
          >
            Admin
          </span>
        </div>

        <nav className="flex flex-1 items-center gap-1 overflow-x-auto p-2 md:w-full md:flex-col md:items-stretch md:gap-1 md:overflow-visible">
          {adminNavItems.map((item, index) => {
            const previousGroup = index > 0 ? adminNavItems[index - 1].group : item.group;
            const startsGroup = item.group !== previousGroup;
            const Icon = item.icon;

            return (
              <div key={item.to} className="contents">
                {startsGroup && (
                  <div
                    aria-hidden
                    className="mx-1 h-6 w-px shrink-0 md:my-1 md:h-px md:w-8 md:self-center"
                    style={{ background: colors.subtleBorder }}
                  />
                )}
                <NavLink
                  to={item.to}
                  end={item.end}
                  aria-label={item.label}
                  title={item.label}
                  className="group relative flex h-9 w-9 shrink-0 items-center justify-center rounded-md transition-colors md:h-10 md:w-10 md:self-center"
                  style={({ isActive }) => ({
                    color: isActive ? colors.gold : colors.textMuted,
                    background: isActive ? "rgba(212,175,55,0.12)" : "transparent",
                    border: `1px solid ${isActive ? colors.goldBorder : "transparent"}`,
                  })}
                >
                  <Icon size={18} />
                  <span
                    role="tooltip"
                    className="pointer-events-none absolute left-full z-50 ml-2 hidden whitespace-nowrap rounded-md border px-2.5 py-1.5 text-[11px] group-hover:block"
                    style={{
                      background: "#14110a",
                      borderColor: colors.goldBorder,
                      color: colors.text,
                      fontFamily: fonts.display,
                      letterSpacing: "0.04em",
                      boxShadow: "0 8px 24px rgba(0,0,0,0.45)",
                    }}
                  >
                    {item.label}
                  </span>
                </NavLink>
              </div>
            );
          })}
        </nav>

        <div className="hidden p-2 md:block">
          <NavLink
            to="/"
            aria-label="Back to game"
            title="Back to game"
            className="group relative flex h-10 w-10 items-center justify-center rounded-md transition-colors hover:bg-white/5"
            style={{ color: colors.muted }}
          >
            <ArrowLeft size={16} />
            <span
              role="tooltip"
              className="pointer-events-none absolute left-full z-50 ml-2 hidden whitespace-nowrap rounded-md border px-2.5 py-1.5 text-[11px] group-hover:block"
              style={{
                background: "#14110a",
                borderColor: colors.goldBorder,
                color: colors.text,
                fontFamily: fonts.display,
                letterSpacing: "0.04em",
              }}
            >
              Back to game
            </span>
          </NavLink>
        </div>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div
          className="flex h-12 shrink-0 items-center gap-3 border-b px-4"
          style={{ borderColor: colors.goldBorder, background: "rgba(10,9,6,0.35)" }}
        >
          <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-[11px]">
            {crumbs.map((crumb, index) => {
              const isLast = index === crumbs.length - 1;
              return (
                <span key={`${crumb.label}-${index}`} className="flex min-w-0 items-center gap-1.5">
                  {index > 0 && <span style={{ color: "rgba(168,145,106,0.4)" }}>/</span>}
                  {crumb.to && !isLast ? (
                    <Link
                      to={crumb.to}
                      className="truncate no-underline transition-colors hover:text-[#D4AF37]"
                      style={{
                        color: colors.goldMuted,
                        fontFamily: fonts.display,
                        letterSpacing: "0.04em",
                      }}
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span
                      className="truncate"
                      aria-current={isLast ? "page" : undefined}
                      style={{
                        color: isLast ? colors.text : colors.muted,
                        fontFamily: fonts.display,
                        letterSpacing: "0.04em",
                      }}
                    >
                      {crumb.label}
                    </span>
                  )}
                </span>
              );
            })}
          </nav>

          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="ml-auto flex h-8 items-center gap-2 rounded-md px-2.5 transition-colors hover:bg-white/5"
            style={{
              background: "rgba(0,0,0,0.25)",
              border: `1px solid ${colors.goldBorder}`,
              color: colors.muted,
              cursor: "pointer",
              fontFamily: fonts.body,
              fontSize: 12,
            }}
            aria-label="Search admin content"
          >
            <Search size={14} />
            <span className="hidden sm:inline">Search everything</span>
            <kbd
              style={{
                padding: "1px 5px",
                border: `1px solid ${colors.subtleBorder}`,
                borderRadius: 4,
                color: colors.goldMuted,
                fontSize: 9,
                fontFamily: fonts.display,
                letterSpacing: "0.06em",
              }}
            >
              ⌘K
            </kbd>
          </button>
        </div>

        <div className="min-h-0 min-w-0 flex-1 overflow-y-auto">
          <Outlet context={{ openSearch: () => setSearchOpen(true) }} />
        </div>
      </div>

      <AdminSearchPalette open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
}
