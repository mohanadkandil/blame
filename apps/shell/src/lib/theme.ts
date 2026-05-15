import { createSignal } from "solid-js";

export const THEMES = ["cadence", "midnight", "claude"] as const;
export type Theme = (typeof THEMES)[number];

export const THEME_LABELS: Record<Theme, string> = {
  cadence: "Cadence",
  midnight: "Midnight",
  claude: "Claude",
};

const STORAGE_KEY = "cadence:theme";

function readStored(): Theme {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v && (THEMES as readonly string[]).includes(v)) return v as Theme;
  } catch {
    /* localStorage unavailable */
  }
  return "cadence";
}

// Applied synchronously at module load → zero theme flash on boot.
const initial = readStored();
document.documentElement.setAttribute("data-theme", initial);

const [theme, setThemeSignal] = createSignal<Theme>(initial);

export { theme };

export function setTheme(next: Theme) {
  document.documentElement.setAttribute("data-theme", next);
  setThemeSignal(next);
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    /* ignore */
  }
}

export function cycleTheme() {
  const i = THEMES.indexOf(theme());
  setTheme(THEMES[(i + 1) % THEMES.length]);
}
