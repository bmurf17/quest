import { colors, fonts } from "@/theme";
import { CreateRoomForm } from "./create-room/CreateRoomForm";
import { icons } from "./create-room/icons";
import { Toast } from "./create-room/Toast";
import { useCreateRoomForm } from "./create-room/useCreateRoomForm";

export default function ManageRooms() {
  const form = useCreateRoomForm();
  const { rooms, toast, setToast } = form;

  return (
    <>
      <style>{`
        
        * { box-sizing: border-box; }
        input[type=number]::-webkit-inner-spin-button { opacity: 0.4; }
        select option { background: #1a1209; color: #E8DCC8; }
      `}</style>

      <main
        style={{
          background:
            "linear-gradient(160deg, #0d0b07 0%, #1a1209 50%, #0f0e09 100%)",
          padding: "32px 24px 64px",
          fontFamily: "'Crimson Text', Georgia, serif",
        }}
      >
        <div style={{ maxWidth: 760, margin: "0 auto 32px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 8,
            }}
          >
            <div
              style={{
                width: 3,
                height: 28,
                background: `linear-gradient(to bottom, ${colors.gold}, transparent)`,
                borderRadius: 2,
              }}
            />
            <h1
              style={{
                margin: 0,
                fontSize: 28,
                fontWeight: 700,
                color: colors.text,
                fontFamily: fonts.display,
                letterSpacing: "0.05em",
              }}
            >
              World Builder
            </h1>
            <div
              style={{
                marginLeft: "auto",
                display: "flex",
                gap: 6,
                alignItems: "center",
                background: "rgba(212,175,55,0.08)",
                border: `1px solid ${colors.goldBorder}`,
                borderRadius: 20,
                padding: "4px 12px 4px 8px",
              }}
            >
              <span style={{ color: colors.gold }}>{icons.compass}</span>
              <span
                style={{
                  fontSize: 12,
                  color: colors.goldMuted,
                  fontFamily: fonts.display,
                  letterSpacing: "0.08em",
                }}
              >
                {rooms.length} rooms
              </span>
            </div>
          </div>
          <p
            style={{
              margin: 0,
              color: "#6B7280",
              fontSize: 15,
              paddingLeft: 15,
            }}
          >
            Forge new chambers for adventurers to discover
          </p>
        </div>

        <div
          style={{
            maxWidth: 760,
            margin: "0 auto",
            background: "rgba(255,255,255,0.025)",
            border: "1px solid rgba(180,140,80,0.2)",
            borderRadius: 12,
            padding: 32,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 12,
              left: 12,
              width: 20,
              height: 20,
              borderTop: `1px solid ${colors.goldBorder}`,
              borderLeft: `1px solid ${colors.goldBorder}`,
              borderRadius: "2px 0 0 0",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 12,
              right: 12,
              width: 20,
              height: 20,
              borderTop: "1px solid rgba(212,175,55,0.4)",
              borderRight: "1px solid rgba(212,175,55,0.4)",
              borderRadius: "0 2px 0 0",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: 12,
              left: 12,
              width: 20,
              height: 20,
              borderBottom: "1px solid rgba(212,175,55,0.4)",
              borderLeft: "1px solid rgba(212,175,55,0.4)",
              borderRadius: "0 0 0 2px",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: 12,
              right: 12,
              width: 20,
              height: 20,
              borderBottom: "1px solid rgba(212,175,55,0.4)",
              borderRight: "1px solid rgba(212,175,55,0.4)",
              borderRadius: "0 0 2px 0",
            }}
          />

          <CreateRoomForm form={form} />
        </div>
      </main>

      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}
