import type { Camp } from "@/types/RoomInteractions";
import { ActionBtn } from "./ActionBtn";
import { SectionLabel } from "./SectionLabel";
import type { CSSProperties } from "react";

export function CampActions({ camp, onRest }: { camp: Camp; onRest: (camp: Camp) => void }) {
  return (
    <div style={campActionsStyle}>
      <SectionLabel>Camp</SectionLabel>
      <ActionBtn variant="success" onClick={() => onRest(camp)} fullWidth>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          width={13}
          height={13}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
          />
        </svg>
        Rest &amp; Recover
      </ActionBtn>
    </div>
  );
}

// Static style objects hoisted out of the render path.
const campActionsStyle: CSSProperties = { display: "flex", flexDirection: "column", gap: 6 };
