import { colors, fonts } from "@/theme";
import { inputStyle } from "./styles";

export const Label = ({
  htmlFor,
  children,
}: {
  htmlFor: string;
  children: React.ReactNode;
}) => (
  <label
    htmlFor={htmlFor}
    style={{
      display: "block",
      fontSize: 11,
      fontWeight: 600,
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      color: colors.muted,
      marginBottom: 6,
      fontFamily: fonts.display,
    }}
  >
    {children}
  </label>
);

export const FieldGroup = ({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
}) => (
  <div style={{ marginBottom: 16 }}>
    <Label htmlFor={id}>{label}</Label>
    {children}
  </div>
);

export const StyledInput = (
  props: React.InputHTMLAttributes<HTMLInputElement>,
) => (
  <input
    {...props}
    style={{ ...inputStyle, ...props.style }}
    onFocus={(e) => {
      e.currentTarget.style.borderColor = colors.gold;
    }}
    onBlur={(e) => {
      e.currentTarget.style.borderColor = `${colors.goldBorder}`;
    }}
  />
);

export const StyledSelect = (
  props: React.SelectHTMLAttributes<HTMLSelectElement>,
) => (
  <select
    {...props}
    style={{
      ...inputStyle,
      appearance: "none",
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24'%3E%3Cpath stroke='%239CA3AF' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
      backgroundRepeat: "no-repeat",
      backgroundPosition: "right 12px center",
      backgroundSize: 16,
      paddingRight: 36,
      cursor: "pointer",
      ...props.style,
    }}
    onFocus={(e) => {
      e.currentTarget.style.borderColor = colors.gold;
    }}
    onBlur={(e) => {
      e.currentTarget.style.borderColor = colors.goldBorder;
    }}
  />
);

export const Divider = ({ label }: { label: string }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 12,
      margin: "20px 0 16px",
    }}
  >
    <div
      style={{
        flex: 1,
        height: 1,
        background: `linear-gradient(to right, transparent, ${colors.goldBorder})`,
      }}
    />
    <span
      style={{
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: colors.goldMuted,
        fontFamily: fonts.display,
      }}
    >
      {label}
    </span>
    <div
      style={{
        flex: 1,
        height: 1,
        background:
          "linear-gradient(to left, transparent, rgba(180,140,80,0.3))",
      }}
    />
  </div>
);
