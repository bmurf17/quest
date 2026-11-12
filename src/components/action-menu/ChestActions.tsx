import { Chest } from "@/types/RoomInteractions";
import { ActionBtn } from "./ActionBtn";
import { SectionLabel } from "./SectionLabel";

export function ChestActions({
  chest,
  onUpdate,
  onTakeAll,
}: {
  chest: Chest;
  onUpdate: (chest: Chest) => void;
  onTakeAll: (chest: Chest) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <SectionLabel>Chest</SectionLabel>
      {!chest.isOpen ? (
        <ActionBtn
          variant="success"
          onClick={() => onUpdate({ ...chest, isOpen: true })}
          fullWidth
        >
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
              d="M13.5 10.5V6.75a4.5 4.5 0 1 1 9 0v3.75M3.75 21.75h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H3.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
            />
          </svg>
          Open Chest
        </ActionBtn>
      ) : chest.quantity === 0 ? (
        <ActionBtn
          variant="muted"
          onClick={() => onUpdate({ ...chest, isOpen: false })}
          fullWidth
        >
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
              d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
            />
          </svg>
          Close (Empty)
        </ActionBtn>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 6,
          }}
        >
          <ActionBtn onClick={() => onUpdate({ ...chest, isOpen: false })}>
            Close
          </ActionBtn>
          <ActionBtn
            variant="success"
            onClick={() => onTakeAll({ ...chest, quantity: 0 })}
          >
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
                d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
              />
            </svg>
            Take All
          </ActionBtn>
        </div>
      )}
    </div>
  );
}
