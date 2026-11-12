import { ActionBtn } from "./ActionBtn";
import { SectionLabel } from "./SectionLabel";
import type { CSSProperties } from "react";

export function TownActions({
  onExplore,
  onShop,
  onRest,
}: {
  onExplore: () => void;
  onShop: () => void;
  onRest: () => void;
}) {
  return (
    <div style={townActionsStyle}>
      <SectionLabel>Town</SectionLabel>
      <ActionBtn variant="success" onClick={onExplore} fullWidth>
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
            d="m6.115 5.19.372 1.111a4.956 4.956 0 0 0 2.348 2.348l1.111.372a1 1 0 0 1 0 1.894l-1.111.372a4.956 4.956 0 0 0-2.348 2.348l-.372 1.111a1 1 0 0 1-1.894 0l-.372-1.111a4.956 4.956 0 0 0-2.348-2.348l-1.111-.372a1 1 0 0 1 0-1.894l1.111-.372a4.956 4.956 0 0 0 2.348-2.348l.372-1.111a1 1 0 0 1 1.894 0ZM17.657 6.343a1 1 0 0 1 0 1.414l-.636.636a4.956 4.956 0 0 0-2.348 2.348l-.636.636a1 1 0 0 1-1.414 0l-.636-.636a4.956 4.956 0 0 0-2.348-2.348l-.636-.636a1 1 0 0 1 0-1.414l.636-.636a4.956 4.956 0 0 0 2.348-2.348l.636-.636a1 1 0 0 1 1.414 0l.636.636a4.956 4.956 0 0 0 2.348 2.348l.636.636ZM10 13a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z"
          />
        </svg>
        Explore
      </ActionBtn>
      <ActionBtn variant="success" onClick={onShop} fullWidth>
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
            d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z"
          />
        </svg>
        Shop
      </ActionBtn>
      <ActionBtn variant="success" onClick={onRest} fullWidth>
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
            d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z"
          />
        </svg>
        Rest at Inn
      </ActionBtn>
    </div>
  );
}

// Static style objects hoisted out of the render path.
const townActionsStyle: CSSProperties = { display: "flex", flexDirection: "column", gap: 6 };
