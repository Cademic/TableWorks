import { Moon, Sun, Monitor } from "lucide-react";
import { useThemeContext } from "../../context/ThemeContext";

export function Navbar() {
  const { themeMode, setThemeMode } = useThemeContext();

  function cycleTheme() {
    const modes: Array<"light" | "dark" | "system"> = ["light", "dark", "system"];
    const currentIndex = modes.indexOf(themeMode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    setThemeMode(nextMode);
  }

  const ThemeIcon = themeMode === "dark" ? Moon : themeMode === "light" ? Sun : Monitor;

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-surface px-6">
      <h2 className="text-sm font-semibold text-foreground">Dashboard</h2>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={cycleTheme}
          title={`Theme: ${themeMode}`}
          className="inline-flex items-center justify-center rounded-lg border border-border p-2 text-foreground/60 transition-colors hover:bg-background hover:text-foreground"
          aria-label={`Switch theme (current: ${themeMode})`}
        >
          <ThemeIcon className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
