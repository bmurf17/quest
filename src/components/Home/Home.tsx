import { Link } from "react-router-dom";

import { colors, fonts } from "@/theme";
import type { CSSProperties } from "react";

export default function Home() {
  return (
    <>
      <div style={homeStyle}>
        <div style={homeStyle2} />
        <div style={homeStyle3} />

        <div style={homeStyle4}>
          <div className="home-divider" style={homeStyle5}>
            <div style={homeStyle6} />
            <div style={homeStyle7} />
            <div style={homeStyle8} />
          </div>

          <h1 className="home-title" style={homeStyle9}>
            Qwest
          </h1>

          <div className="home-divider" style={homeStyle10}>
            <div style={homeStyle11} />
            <div style={{ display: "flex", gap: 6 }}>
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  style={{
                    width: 3,
                    height: 3,
                    background: `rgba(212,175,55,${0.2 + i * 0.15})`,
                    borderRadius: "50%",
                  }}
                />
              ))}
            </div>
            <div style={homeStyle12} />
          </div>

          <div className="home-btn">
            <Link to="/party" className="start-btn">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                width={18}
                height={18}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z"
                />
              </svg>
              Begin Adventure
            </Link>
          </div>

          <div className="home-settings" style={{ marginTop: 16 }}>
            <button className="settings-link">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                width={14}
                height={14}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.43l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                />
              </svg>
              Settings
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// Static style objects hoisted out of the render path.
const homeStyle: CSSProperties = {
  minHeight: "100vh",
  background: "linear-gradient(160deg, #0d0b07 0%, #1a1209 55%, #0f0e09 100%)",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: "40px 24px",
  fontFamily: fonts.body,
  position: "relative",
  overflow: "hidden",
};
const homeStyle2: CSSProperties = {
  position: "absolute",
  inset: 0,
  pointerEvents: "none",
  backgroundImage: "radial-gradient(circle, rgba(180,140,80,0.1) 1px, transparent 1px)",
  backgroundSize: "40px 40px",
};
const homeStyle3: CSSProperties = {
  position: "absolute",
  inset: 0,
  pointerEvents: "none",
  background: "radial-gradient(ellipse at center, transparent 30%, rgba(13,11,7,0.85) 100%)",
};
const homeStyle4: CSSProperties = {
  position: "relative",
  zIndex: 1,
  textAlign: "center",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 0,
};
const homeStyle5: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  marginBottom: 28,
};
const homeStyle6: CSSProperties = {
  width: 48,
  height: 1,
  background: "linear-gradient(to left, rgba(212,175,55,0.5), transparent)",
};
const homeStyle7: CSSProperties = {
  width: 6,
  height: 6,
  background: "rgba(212,175,55,0.6)",
  transform: "rotate(45deg)",
};
const homeStyle8: CSSProperties = {
  width: 48,
  height: 1,
  background: "linear-gradient(to right, rgba(212,175,55,0.5), transparent)",
};
const homeStyle9: CSSProperties = {
  margin: "0 0 12px",
  fontSize: "clamp(40px, 8vw, 72px)",
  fontWeight: 900,
  fontFamily: fonts.display,
  color: colors.text,
  letterSpacing: "0.08em",
  lineHeight: 1.1,
  textShadow: `0 2px 40px ${colors.gold}26`,
};
const homeStyle10: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  marginBottom: 44,
};
const homeStyle11: CSSProperties = {
  width: 80,
  height: 1,
  background: "linear-gradient(to left, rgba(180,140,80,0.3), transparent)",
};
const homeStyle12: CSSProperties = {
  width: 80,
  height: 1,
  background: "linear-gradient(to right, rgba(180,140,80,0.3), transparent)",
};
