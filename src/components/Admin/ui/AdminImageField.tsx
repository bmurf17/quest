import { useMemo, useRef, useState } from "react";
import { ImageIcon, Search, Upload, X } from "lucide-react";
import { colors, fonts } from "@/theme";
import { IMAGE_ASSETS, IMAGE_ASSET_CATEGORIES, type ImageAssetCategory } from "@/data/imageAssets";
import { resolveEntityImage } from "@/lib/entityImages";
import { uploadImage, type ImageUploadTarget } from "@/lib/imageUpload";
import { StyledInput } from "@/components/Admin/game-design/create-room/primitives";
import type { CSSProperties } from "react";

type CategoryFilter = ImageAssetCategory | "all";

export interface AdminImageFieldProps {
  id?: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  /** Category highlighted first in the picker and preferred for name collisions. */
  category?: ImageAssetCategory;
  placeholder?: string;
  hint?: string;
  previewSize?: number;
  /** Enables an Upload button that writes into public/images/<directory>. */
  upload?: ImageUploadTarget;
}

/**
 * Shared image picker for admin editors: type a path/URL or choose from the
 * generated `public/images` + `src/assets` library.
 */
export function AdminImageField({
  id,
  label = "Image",
  value,
  onChange,
  category,
  placeholder = "/images/enemies/Mushroom.png",
  hint = "Choose from the library or paste a path/URL.",
  previewSize = 54,
  upload,
}: AdminImageFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>(category ?? "all");

  const preview = resolveEntityImage(value, category);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !upload) return;

    setIsUploading(true);
    setUploadError(null);
    try {
      const url = await uploadImage(file, upload);
      onChange(url);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setIsUploading(false);
    }
  }

  const visibleAssets = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return IMAGE_ASSETS.filter((asset) => {
      const matchesCategory = activeCategory === "all" || asset.category === activeCategory;
      const matchesQuery =
        !needle ||
        asset.label.toLowerCase().includes(needle) ||
        asset.key.toLowerCase().includes(needle) ||
        asset.sourcePath.toLowerCase().includes(needle);
      return matchesCategory && matchesQuery;
    });
  }, [activeCategory, query]);

  const tabs: { id: CategoryFilter; label: string }[] = [
    { id: "all", label: "All" },
    ...IMAGE_ASSET_CATEGORIES,
  ];

  return (
    <div style={fieldStyle}>
      <label htmlFor={id} style={labelStyle}>
        {label}
      </label>

      <div style={rowStyle}>
        <div style={{ ...previewBoxStyle, width: previewSize, height: previewSize }}>
          {preview ? (
            <img src={preview} alt="" style={previewImageStyle} />
          ) : (
            <ImageIcon size={20} style={{ color: "#6B7280" }} />
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <StyledInput
            id={id}
            value={value}
            placeholder={placeholder}
            onChange={(event) => onChange(event.target.value)}
          />
          <div style={hintStyle}>{hint}</div>
        </div>

        <div style={actionsStyle}>
          {upload && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
                onChange={(event) => void handleFileChange(event)}
                style={hiddenInputStyle}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                style={{ ...browseButtonStyle, opacity: isUploading ? 0.6 : 1 }}
              >
                <Upload size={12} />
                {isUploading ? "Uploading…" : "Upload"}
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() => setIsOpen((current) => !current)}
            aria-expanded={isOpen}
            style={browseButtonStyle}
          >
            {isOpen ? "Close" : "Browse"}
          </button>
          {value && (
            <button
              type="button"
              onClick={() => onChange("")}
              aria-label="Clear image"
              title="Clear image"
              style={clearButtonStyle}
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {uploadError && <div style={uploadErrorStyle}>{uploadError}</div>}

      {isOpen && (
        <div style={pickerStyle}>
          <div style={pickerSearchRowStyle}>
            <Search size={13} style={{ color: colors.muted, flexShrink: 0 }} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search images…"
              aria-label="Search image library"
              style={pickerSearchStyle}
            />
            <span style={countStyle}>{visibleAssets.length}</span>
          </div>

          <div style={tabsStyle} role="tablist" aria-label="Image categories">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeCategory === tab.id}
                onClick={() => setActiveCategory(tab.id)}
                style={{
                  ...tabStyle,
                  ...(activeCategory === tab.id ? tabActiveStyle : {}),
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {visibleAssets.length === 0 ? (
            <div style={emptyStyle}>No images match. Paste a path or URL above instead.</div>
          ) : (
            <div style={assetGridStyle}>
              {visibleAssets.map((asset) => {
                const selected = value === asset.sourcePath;
                return (
                  <button
                    key={asset.sourcePath}
                    type="button"
                    onClick={() => {
                      onChange(asset.sourcePath);
                      setIsOpen(false);
                    }}
                    title={asset.sourcePath}
                    aria-pressed={selected}
                    style={{
                      ...assetStyle,
                      ...(selected ? assetSelectedStyle : {}),
                    }}
                  >
                    <img src={asset.src} alt="" loading="lazy" style={assetImageStyle} />
                    <span style={assetLabelStyle}>{asset.label}</span>
                    <span style={assetCategoryStyle}>{asset.category}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const fieldStyle: CSSProperties = { marginBottom: 14, minWidth: 0 };
const labelStyle: CSSProperties = {
  display: "block",
  marginBottom: 5,
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: colors.muted,
  fontFamily: fonts.display,
};
const rowStyle: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: 10,
  flexWrap: "wrap",
};
const previewBoxStyle: CSSProperties = {
  flexShrink: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "rgba(0,0,0,0.4)",
  border: `1px solid ${colors.goldBorder}`,
  borderRadius: 7,
  overflow: "hidden",
};
const previewImageStyle: CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "contain",
  imageRendering: "pixelated",
};
const hintStyle: CSSProperties = {
  marginTop: 4,
  fontSize: 10,
  lineHeight: 1.4,
  color: "#6B7280",
};
const actionsStyle: CSSProperties = { display: "flex", alignItems: "center", gap: 4 };
const hiddenInputStyle: CSSProperties = { display: "none" };
const uploadErrorStyle: CSSProperties = {
  marginTop: 6,
  padding: "6px 9px",
  background: "rgba(220,38,38,0.08)",
  border: "1px solid rgba(220,38,38,0.25)",
  borderRadius: 5,
  color: "#FCA5A5",
  fontSize: 11,
  lineHeight: 1.4,
};
const browseButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 5,
  padding: "8px 11px",
  background: "rgba(212,175,55,0.1)",
  border: `1px solid ${colors.goldBorder}`,
  borderRadius: 5,
  color: colors.gold,
  fontSize: 11,
  fontFamily: fonts.display,
  letterSpacing: "0.04em",
  cursor: "pointer",
  whiteSpace: "nowrap",
};
const clearButtonStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: 30,
  height: 30,
  padding: 0,
  background: "rgba(220,38,38,0.08)",
  border: "1px solid rgba(220,38,38,0.25)",
  borderRadius: 5,
  color: "#FCA5A5",
  cursor: "pointer",
};
const pickerStyle: CSSProperties = {
  marginTop: 10,
  padding: 12,
  background: "rgba(0,0,0,0.35)",
  border: `1px solid ${colors.goldBorder}`,
  borderRadius: 8,
};
const pickerSearchRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 7,
  padding: "0 9px",
  marginBottom: 8,
  background: "rgba(0,0,0,0.35)",
  border: `1px solid ${colors.subtleBorder}`,
  borderRadius: 6,
};
const pickerSearchStyle: CSSProperties = {
  flex: 1,
  padding: "8px 0",
  background: "transparent",
  border: "none",
  color: colors.text,
  fontSize: 12,
  fontFamily: fonts.body,
  outline: "none",
};
const countStyle: CSSProperties = { fontSize: 10, color: "#6B7280" };
const tabsStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 4,
  marginBottom: 10,
};
const tabStyle: CSSProperties = {
  padding: "4px 8px",
  background: "transparent",
  border: "1px solid transparent",
  borderRadius: 4,
  color: colors.muted,
  fontSize: 10,
  fontFamily: fonts.display,
  letterSpacing: "0.04em",
  cursor: "pointer",
};
const tabActiveStyle: CSSProperties = {
  background: "rgba(212,175,55,0.12)",
  borderColor: colors.goldBorder,
  color: colors.gold,
};
const assetGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(82px, 1fr))",
  gap: 6,
  maxHeight: 260,
  overflowY: "auto",
  paddingRight: 2,
};
const assetStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 3,
  padding: "7px 5px",
  background: "rgba(255,255,255,0.025)",
  border: `1px solid ${colors.subtleBorder}`,
  borderRadius: 6,
  color: colors.text,
  cursor: "pointer",
  minWidth: 0,
};
const assetSelectedStyle: CSSProperties = {
  background: "rgba(212,175,55,0.12)",
  borderColor: colors.gold,
};
const assetImageStyle: CSSProperties = {
  width: 42,
  height: 42,
  objectFit: "contain",
  imageRendering: "pixelated",
};
const assetLabelStyle: CSSProperties = {
  maxWidth: "100%",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  fontSize: 10,
  fontFamily: fonts.display,
};
const assetCategoryStyle: CSSProperties = {
  fontSize: 8,
  color: "#6B7280",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};
const emptyStyle: CSSProperties = {
  padding: "16px 8px",
  textAlign: "center",
  fontSize: 11,
  color: colors.muted,
};
