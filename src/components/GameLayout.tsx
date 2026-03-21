import { GameState, useGameStore } from "../state/GameState";
import { colors, fonts } from "../theme";
import Party from "./Party";
import ActionMenu from "./ActionMenu";
import MainGameArea from "./MainGameArea/MainGameArea";
import ActivityLog from "./ActivityLog";

const LABEL_STYLE: React.CSSProperties = {
  fontSize: 9,
  fontWeight: 700,
  color: colors.goldMuted,
  fontFamily: fonts.display,
  letterSpacing: "0.12em",
  textTransform: "uppercase" as const,
};

const DIVIDER: React.CSSProperties = {
  flex: 1,
  height: 1,
  background: colors.goldBorder,
};

export default function GameLayout() {
  const activityLog = useGameStore((state: GameState) => state.activityLog);
  const party = useGameStore((state: GameState) => state.party);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#111009", overflow: "hidden" }}>

      <div style={{ flex: 1,  minHeight: 0, position: "relative", overflow: "hidden" }}>
        <MainGameArea />
      </div>

     <div style={{
        height: 260, 
        flexShrink: 0,
        display: "grid",
        gridTemplateColumns: "320px 1fr 340px",
        borderTop: "1px solid rgba(180,140,80,0.2)",
        background: "rgba(8,7,5,0.97)",
        position: "relative",
        zIndex: 10,
        overflow: "hidden",
      }}>

  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(to right, transparent, ${colors.gold} 30%, ${colors.gold} 70%, transparent)`, pointerEvents: "none" }} />

  <div style={{ borderRight: `1px solid ${colors.goldBorder}`, padding: "8px", overflow: "hidden", display: "flex", flexDirection: "column" }}>
           <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0, marginBottom: 6 }}>
            <span style={LABEL_STYLE}>Log</span>
            <div style={DIVIDER} />
          </div>
          <ActivityLog activityLog={activityLog} />
        </div>

  <div style={{ borderRight: `1px solid ${colors.goldBorder}`, padding: "8px 10px", display: "flex", flexDirection: "column", gap: 6, overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <span style={LABEL_STYLE}>Party</span>
            <div style={DIVIDER} />
          </div>
          <Party party={party} />
        </div>

        <div style={{ padding: "8px 10px", display: "flex", flexDirection: "column", gap: 6, overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <span style={LABEL_STYLE}>Actions</span>
            <div style={DIVIDER} />
          </div>
          <div style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
            <ActionMenu />
          </div>
        </div>

      </div>
    </div>
  );
}