import { useLayoutEffect, useMemo, useRef, useState } from "react";
import type { ClassSkillTree, SkillNode } from "@/types/SkillTree";
import { colors, fonts } from "@/theme";
import type { CSSProperties } from "react";

type Edge = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

const TIER_COLORS = [
  { glow: colors.gold, border: "rgba(212,175,55,0.5)", bg: "rgba(212,175,55,0.08)" },
  { glow: colors.goldMuted, border: "rgba(201,168,76,0.4)", bg: "rgba(201,168,76,0.06)" },
  { glow: "#B8943E", border: "rgba(184,148,62,0.3)", bg: "rgba(184,148,62,0.05)" },
  { glow: "#A07E30", border: "rgba(160,126,48,0.2)", bg: "rgba(160,126,48,0.04)" },
];

function NodeCircle({ letter, tier }: { letter: string; tier: number }) {
  const c = TIER_COLORS[Math.min(tier, 3)];
  return (
    <svg width={44} height={44} viewBox="0 0 44 44" style={{ flexShrink: 0 }}>
      <defs>
        <radialGradient id={`grad-${tier}`} cx="35%" cy="30%">
          <stop offset="0%" stopColor={c.glow} stopOpacity={0.3} />
          <stop offset="100%" stopColor={c.glow} stopOpacity={0.05} />
        </radialGradient>
      </defs>
      <circle
        cx={22}
        cy={22}
        r={20}
        fill={`url(#grad-${tier})`}
        stroke={c.border}
        strokeWidth={1.5}
      />
      <text
        x={22}
        y={22}
        textAnchor="middle"
        dominantBaseline="central"
        fill={colors.goldMuted}
        fontFamily={fonts.display}
        fontSize={17}
        fontWeight={700}
      >
        {letter}
      </text>
    </svg>
  );
}

function SkillNodeCard({ node, tier, level }: { node: SkillNode; tier: number; level: number }) {
  const c = TIER_COLORS[Math.min(tier, 3)];
  const requiredLevel = 1 + tier * 2;
  const isAvailable = level >= requiredLevel;

  return (
    <div
      data-node-id={node.id}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
        width: 130,
        padding: "10px 8px",
        background: c.bg,
        border: `1px solid ${isAvailable ? c.border : "rgba(255,255,255,0.04)"}`,
        borderRadius: 8,
        opacity: isAvailable ? 1 : 0.4,
        transition: "opacity 0.2s",
      }}
    >
      <NodeCircle letter={node.name[0]} tier={tier} />
      <span style={skillNodeCardStyle}>{node.name}</span>
      <span style={skillNodeCardStyle2}>{node.description}</span>
      <span
        style={{
          fontSize: 8,
          color: isAvailable ? colors.muted : colors.textMuted,
          fontFamily: fonts.display,
          marginTop: 2,
        }}
      >
        Lv.{requiredLevel}
      </span>
    </div>
  );
}

export default function SkillTreeView({ tree, level }: { tree: ClassSkillTree; level: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [svgSize, setSvgSize] = useState({ width: 0, height: 0 });

  const { tiers } = useMemo(() => {
    const maxTier = Math.max(...tree.nodes.map((n) => n.tier));
    const groups: SkillNode[][] = [];
    for (let t = 0; t <= maxTier; t++) {
      groups.push(tree.nodes.filter((n) => n.tier === t));
    }
    return { tiers: groups };
  }, [tree]);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const calculatedEdges: Edge[] = [];

    for (const node of tree.nodes) {
      for (const prereqId of node.prerequisites) {
        const parentEl = container.querySelector(`[data-node-id="${prereqId}"]`);
        const childEl = container.querySelector(`[data-node-id="${node.id}"]`);
        if (!parentEl || !childEl) continue;

        const parentRect = parentEl.getBoundingClientRect();
        const childRect = childEl.getBoundingClientRect();

        calculatedEdges.push({
          x1: parentRect.left - containerRect.left + parentRect.width / 2,
          y1: parentRect.bottom - containerRect.top,
          x2: childRect.left - containerRect.left + childRect.width / 2,
          y2: childRect.top - containerRect.top,
        });
      }
    }

    setEdges(calculatedEdges);
    setSvgSize({ width: containerRect.width, height: containerRect.height });
  }, [tree, level]);

  return (
    <div style={{ padding: "4px 0 12px" }}>
      <div style={{ textAlign: "center", marginBottom: 16 }}>
        <span style={skillTreeViewStyle}>{tree.className} — Skill Tree</span>
      </div>

      <div ref={containerRef} style={skillTreeViewStyle2}>
        {svgSize.width > 0 && (
          <svg width={svgSize.width} height={svgSize.height} style={skillTreeViewStyle3}>
            {edges.map((edge, i) => {
              const midY = edge.y1 + (edge.y2 - edge.y1) / 2;
              const d = `M ${edge.x1} ${edge.y1} L ${edge.x1} ${midY} L ${edge.x2} ${midY} L ${edge.x2} ${edge.y2}`;
              return (
                <path key={i} d={d} stroke="rgba(180,140,80,0.12)" strokeWidth={1.5} fill="none" />
              );
            })}
          </svg>
        )}

        {tiers.map((tierNodes, tierIndex) => (
          <div
            key={tierIndex}
            style={{
              display: "flex",
              gap: tierIndex === 0 ? 0 : 28,
              justifyContent: "center",
              position: "relative",
              zIndex: 1,
            }}
          >
            {tierNodes.map((node) => (
              <SkillNodeCard key={node.id} node={node} tier={tierIndex} level={level} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// Static style objects hoisted out of the render path.
const skillNodeCardStyle: CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  color: colors.goldMuted,
  fontFamily: fonts.display,
  textAlign: "center",
  lineHeight: 1.2,
  marginTop: 2,
};
const skillNodeCardStyle2: CSSProperties = {
  fontSize: 9,
  color: colors.textMuted,
  fontFamily: fonts.body,
  textAlign: "center",
  lineHeight: 1.3,
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  minHeight: "2.6em",
};
const skillTreeViewStyle: CSSProperties = {
  fontSize: 13,
  color: colors.goldMuted,
  fontFamily: fonts.display,
  fontWeight: 700,
  letterSpacing: "0.15em",
  textTransform: "uppercase",
};
const skillTreeViewStyle2: CSSProperties = {
  position: "relative",
  display: "flex",
  flexDirection: "column",
  gap: 20,
  alignItems: "center",
};
const skillTreeViewStyle3: CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  pointerEvents: "none",
  zIndex: 0,
  overflow: "visible",
};
