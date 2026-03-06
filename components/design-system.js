// ─── Design System — matching the Claude web app aesthetic ─────────────────
// Warm, clean, literary. Dark mode with terracotta accent.

export const C = {
  // Backgrounds
  bg: "#2B2B28",
  bgComposer: "#343432",
  bgDeep: "#1A1A18",
  bgHover: "rgba(255,255,255,0.06)",
  bgCode: "#1E1E1C",
  bgOverlay: "rgba(0,0,0,0.6)",

  // Text
  text: "#ECECEA",
  textSec: "#B4B3AB",
  textMuted: "#8C8B84",

  // Accent — Claude's warm terracotta/coral
  accent: "#DA7756",
  accentHover: "#E28A6A",
  accentSoft: "rgba(218,119,86,0.12)",
  accentSoftHover: "rgba(218,119,86,0.2)",

  // Semantic colors
  green: "#7dba6d",
  red: "#cf6b63",
  blue: "#6ba8cf",
  purple: "#9b7ed4",
  yellow: "#cfb86b",

  // Borders
  border: "rgba(255,255,255,0.08)",
  borderHover: "rgba(255,255,255,0.15)",

  // Typography — using CSS vars from next/font, with fallbacks
  sans: 'var(--font-sans, "Inter", system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif)',
  serif: 'var(--font-serif, "Source Serif 4", Georgia, "Times New Roman", serif)',
  mono: 'var(--font-mono, "JetBrains Mono", ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace)',

  // Shadows
  shadow: "0 4px 24px rgba(0,0,0,0.12), 0 0 0 0.5px rgba(255,255,255,0.06)",
  shadowSoft: "0 2px 12px rgba(0,0,0,0.08), 0 0 0 0.5px rgba(255,255,255,0.04)",
  shadowModal: "0 16px 64px rgba(0,0,0,0.3), 0 0 0 0.5px rgba(255,255,255,0.08)",

  // Grid background
  grid: "linear-gradient(to right, rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px)",

  // Transitions
  transition: "all 0.15s ease",
  transitionFast: "all 0.1s ease",

  // Radii
  radius: 12,
  radiusSm: 8,
  radiusLg: 16,
  radiusPill: 9999,
};
