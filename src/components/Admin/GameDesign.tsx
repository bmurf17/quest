import { Link } from "react-router-dom";
import { colors, fonts } from "../../theme";

const navSections = [
  {
    title: "Game Design",
    description: "Shape the world adventurers will explore",
    items: [
      {
        label: "World Builder",
        description: "Forge new rooms, enemies, and interactions",
        to: "/admin/game-design/rooms",
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} width={22} height={22}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 1 1 9 0v3.75M3.75 21.75h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H3.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
          </svg>
        ),
        accent: "#D4AF37",
        accentBg: "rgba(212,175,55,0.1)",
        accentBorder: "rgba(212,175,55,0.3)",
      },
      {
        label: "Realm Map",
        description: "Visualise and inspect the connected room graph",
        to: "/admin/game-design/roomMap",
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} width={22} height={22}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" />
          </svg>
        ),
        accent: "#818CF8",
        accentBg: "rgba(99,102,241,0.1)",
        accentBorder: "rgba(99,102,241,0.3)",
      },
    ],
  },
];

export default function Admin() {
  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        .admin-card { transition: transform 0.15s, box-shadow 0.15s, border-color 0.15s, background 0.15s; }
        .admin-card:hover { transform: translateY(-2px); }
      `}</style>

      <main style={{
        minHeight: "100vh",
        background: "linear-gradient(160deg, #0d0b07 0%, #1a1209 50%, #0f0e09 100%)",
        padding: "48px 32px 80px",
        fontFamily: fonts.body,
      }}>

        <div style={{ maxWidth: 700, margin: "0 auto 48px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 10 }}>
        <div style={{
          width: 42, height: 42,
          background: colors.goldMuted + "22",
          border: `1px solid ${colors.goldBorder}`,
              borderRadius: 10,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth={1.5} width={22} height={22}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              </svg>
            </div>
            <div>
              <h1 style={{
                margin: 0, fontSize: 30, fontWeight: 700,
                color: colors.text,
                fontFamily: fonts.display,
                letterSpacing: "0.05em",
              }}>
                Admin Console
              </h1>
              <p style={{ margin: 0, fontSize: 14, color: colors.muted }}>
                Shape the realm from behind the veil
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 24 }}>
            <div style={{ flex: 1, height: 1, background: "linear-gradient(to right, transparent, rgba(180,140,80,0.3))" }} />
            <div style={{ width: 5, height: 5, background: "rgba(212,175,55,0.5)", borderRadius: "50%", transform: "rotate(45deg)" }} />
            <div style={{ flex: 1, height: 1, background: "linear-gradient(to left, transparent, rgba(180,140,80,0.3))" }} />
          </div>
        </div>

        <div style={{ maxWidth: 700, margin: "0 auto", display: "flex", flexDirection: "column", gap: 40 }}>
          {navSections.map((section) => (
            <div key={section.title}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <div style={{ width: 2, height: 20, background: "rgba(212,175,55,0.6)", borderRadius: 1 }} />
                <h2 style={{
                  margin: 0, fontSize: 12, fontWeight: 700,
                  color: colors.gold,
                  fontFamily: fonts.display,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                }}>
                  {section.title}
                </h2>
                <span style={{ fontSize: 13, color: "#4B5563", fontFamily: "'Crimson Text', Georgia, serif" }}>
                  — {section.description}
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
                {section.items.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="admin-card"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 16,
                      padding: "18px 20px",
                      background: "rgba(255,255,255,0.025)",
                      border: `1px solid ${item.accentBorder}`,
                      borderRadius: 10,
                      textDecoration: "none",
                      position: "relative",
                      overflow: "hidden",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background = item.accentBg;
                      (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 24px ${item.accent}22`;
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.025)";
                      (e.currentTarget as HTMLElement).style.boxShadow = "none";
                    }}
                  >
                    <div style={{
                      position: "absolute", top: 8, right: 8,
                      width: 10, height: 10,
                      borderTop: `1px solid ${item.accent}55`,
                      borderRight: `1px solid ${item.accent}55`,
                      borderRadius: "0 2px 0 0",
                    }} />

                    <div style={{
                      width: 44, height: 44, flexShrink: 0,
                      background: item.accentBg,
                      border: `1px solid ${item.accentBorder}`,
                      borderRadius: 8,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: item.accent,
                    }}>
                      {item.icon}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 15, fontWeight: 600,
                        color: colors.text,
                        fontFamily: fonts.display,
                        letterSpacing: "0.03em",
                        marginBottom: 3,
                      }}>
                        {item.label}
                      </div>
                      <div style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.4 }}>
                        {item.description}
                      </div>
                    </div>

                    <svg viewBox="0 0 24 24" fill="none" stroke={item.accent} strokeWidth={1.5} width={16} height={16} style={{ flexShrink: 0, opacity: 0.5 }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                    </svg>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}