import { colors, fonts } from "@/theme";
import { icons } from "./icons";
import type { InteractionType} from "./interactionTypes";
import { INTERACTION_TYPES, interactionColors } from "./interactionTypes";
import type { CSSProperties } from "react";

export function InteractionTabs({
  value,
  onChange,
}: {
  value: InteractionType;
  onChange: (v: InteractionType) => void;
}) {
  return (
    <div style={interactionTabsStyle}>
      {INTERACTION_TYPES.map((type) => {
        const active = value === type;
        const color = interactionColors[type];
        return (
          <button
            key={type}
            type="button"
            onClick={() => onChange(type)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 14px",
              borderRadius: 6,
              border: active
                ? `1px solid ${color}`
                : "1px solid rgba(255,255,255,0.08)",
              background: active ? `${color}22` : "rgba(0,0,0,0.2)",
              color: active ? color : colors.muted,
              fontSize: 13,
              fontWeight: active ? 600 : 400,
              cursor: "pointer",
              transition: "all 0.15s",
              fontFamily: fonts.display,
              letterSpacing: "0.03em",
            }}
          >
            <span style={{ color: active ? color : "#6B7280" }}>
              {icons[type]}
            </span>
            {type}
          </button>
        );
      })}
    </div>
  );
}

// Static style objects hoisted out of the render path.
const interactionTabsStyle: CSSProperties = { display: "flex", gap: 6, flexWrap: "wrap" };
