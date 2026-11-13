import { colors, fonts } from "@/theme";
import { CreateRoomForm } from "./create-room/CreateRoomForm";
import { icons } from "./create-room/icons";
import { Toast } from "./create-room/Toast";
import { useCreateRoomForm } from "./create-room/useCreateRoomForm";
import type { CSSProperties } from "react";

export default function ManageRooms() {
  const form = useCreateRoomForm();
  const { rooms, toast, setToast } = form;

  return (
    <>
      <main style={manageRoomsStyle}>
        <div style={{ maxWidth: 760, margin: "0 auto 32px" }}>
          <div style={manageRoomsStyle2}>
            <div style={manageRoomsStyle3} />
            <h1 style={manageRoomsStyle4}>World Builder</h1>
            <div style={manageRoomsStyle5}>
              <span style={{ color: colors.gold }}>{icons.compass}</span>
              <span style={manageRoomsStyle6}>{rooms.length} rooms</span>
            </div>
          </div>
          <p style={manageRoomsStyle7}>Forge new chambers for adventurers to discover</p>
        </div>

        <div style={manageRoomsStyle8}>
          <div style={manageRoomsStyle9} />
          <div style={manageRoomsStyle10} />
          <div style={manageRoomsStyle11} />
          <div style={manageRoomsStyle12} />

          <CreateRoomForm form={form} />
        </div>
      </main>

      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    </>
  );
}

// Static style objects hoisted out of the render path.
const manageRoomsStyle: CSSProperties = {
  minHeight: "100%",
  background: "linear-gradient(160deg, #0d0b07 0%, #1a1209 50%, #0f0e09 100%)",
  padding: "32px 24px 64px",
  fontFamily: "'Crimson Text', Georgia, serif",
};
const manageRoomsStyle2: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  marginBottom: 8,
};
const manageRoomsStyle3: CSSProperties = {
  width: 3,
  height: 28,
  background: `linear-gradient(to bottom, ${colors.gold}, transparent)`,
  borderRadius: 2,
};
const manageRoomsStyle4: CSSProperties = {
  margin: 0,
  fontSize: 28,
  fontWeight: 700,
  color: colors.text,
  fontFamily: fonts.display,
  letterSpacing: "0.05em",
};
const manageRoomsStyle5: CSSProperties = {
  marginLeft: "auto",
  display: "flex",
  gap: 6,
  alignItems: "center",
  background: "rgba(212,175,55,0.08)",
  border: `1px solid ${colors.goldBorder}`,
  borderRadius: 20,
  padding: "4px 12px 4px 8px",
};
const manageRoomsStyle6: CSSProperties = {
  fontSize: 12,
  color: colors.goldMuted,
  fontFamily: fonts.display,
  letterSpacing: "0.08em",
};
const manageRoomsStyle7: CSSProperties = {
  margin: 0,
  color: "#6B7280",
  fontSize: 15,
  paddingLeft: 15,
};
const manageRoomsStyle8: CSSProperties = {
  maxWidth: 760,
  margin: "0 auto",
  background: "rgba(255,255,255,0.025)",
  border: "1px solid rgba(180,140,80,0.2)",
  borderRadius: 12,
  padding: 32,
  position: "relative",
  overflow: "hidden",
};
const manageRoomsStyle9: CSSProperties = {
  position: "absolute",
  top: 12,
  left: 12,
  width: 20,
  height: 20,
  borderTop: `1px solid ${colors.goldBorder}`,
  borderLeft: `1px solid ${colors.goldBorder}`,
  borderRadius: "2px 0 0 0",
};
const manageRoomsStyle10: CSSProperties = {
  position: "absolute",
  top: 12,
  right: 12,
  width: 20,
  height: 20,
  borderTop: "1px solid rgba(212,175,55,0.4)",
  borderRight: "1px solid rgba(212,175,55,0.4)",
  borderRadius: "0 2px 0 0",
};
const manageRoomsStyle11: CSSProperties = {
  position: "absolute",
  bottom: 12,
  left: 12,
  width: 20,
  height: 20,
  borderBottom: "1px solid rgba(212,175,55,0.4)",
  borderLeft: "1px solid rgba(212,175,55,0.4)",
  borderRadius: "0 0 0 2px",
};
const manageRoomsStyle12: CSSProperties = {
  position: "absolute",
  bottom: 12,
  right: 12,
  width: 20,
  height: 20,
  borderBottom: "1px solid rgba(212,175,55,0.4)",
  borderRight: "1px solid rgba(212,175,55,0.4)",
  borderRadius: "0 0 2px 0",
};
