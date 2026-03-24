const PRIMARY = "#0A84FF";
const DARK_BG = "#000000";
const DARK_SURFACE = "#1C1C1E";
const DARK_SURFACE2 = "#2C2C2E";
const DARK_SURFACE3 = "#3A3A3C";
const DARK_TEXT = "#FFFFFF";
const DARK_TEXT_SECONDARY = "rgba(255,255,255,0.6)";
const DARK_TEXT_TERTIARY = "rgba(255,255,255,0.3)";
const DARK_SEPARATOR = "rgba(255,255,255,0.1)";
const DARK_TINT = PRIMARY;

const LIGHT_BG = "#F2F2F7";
const LIGHT_SURFACE = "#FFFFFF";
const LIGHT_SURFACE2 = "#F2F2F7";
const LIGHT_SURFACE3 = "#E5E5EA";
const LIGHT_TEXT = "#000000";
const LIGHT_TEXT_SECONDARY = "rgba(0,0,0,0.55)";
const LIGHT_TEXT_TERTIARY = "rgba(0,0,0,0.3)";
const LIGHT_SEPARATOR = "rgba(0,0,0,0.1)";
const LIGHT_TINT = PRIMARY;

export default {
  light: {
    text: LIGHT_TEXT,
    textSecondary: LIGHT_TEXT_SECONDARY,
    textTertiary: LIGHT_TEXT_TERTIARY,
    background: LIGHT_BG,
    surface: LIGHT_SURFACE,
    surface2: LIGHT_SURFACE2,
    surface3: LIGHT_SURFACE3,
    separator: LIGHT_SEPARATOR,
    tint: LIGHT_TINT,
    tabIconDefault: "rgba(0,0,0,0.3)",
    tabIconSelected: LIGHT_TINT,
    primary: PRIMARY,
    danger: "#FF3B30",
    success: "#34C759",
    warning: "#FF9F0A",
    info: "#5AC8FA",
  },
  dark: {
    text: DARK_TEXT,
    textSecondary: DARK_TEXT_SECONDARY,
    textTertiary: DARK_TEXT_TERTIARY,
    background: DARK_BG,
    surface: DARK_SURFACE,
    surface2: DARK_SURFACE2,
    surface3: DARK_SURFACE3,
    separator: DARK_SEPARATOR,
    tint: DARK_TINT,
    tabIconDefault: "rgba(255,255,255,0.3)",
    tabIconSelected: DARK_TINT,
    primary: PRIMARY,
    danger: "#FF453A",
    success: "#30D158",
    warning: "#FFD60A",
    info: "#64D2FF",
  },
};
