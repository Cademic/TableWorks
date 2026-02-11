import { Moon, Sun, Monitor, ArrowLeft } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useThemeContext } from "../../context/ThemeContext";

interface NavbarProps {
  /** Board name to display when viewing a board page */
  boardName?: string | null;
}

export function Navbar({ boardName }: NavbarProps) {
  const { themeMode, setThemeMode } = useThemeContext();
  const location = useLocation();
  const navigate = useNavigate();

  const isOnBoardPage = location.pathname.startsWith("/boards/");

  function cycleTheme() {
    const modes: Array<"light" | "dark" | "system"> = ["light", "dark", "system"];
    const currentIndex = modes.indexOf(themeMode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    setThemeMode(nextMode);
  }

  const ThemeIcon = themeMode === "dark" ? Moon : themeMode === "light" ? Sun : Monitor;

  // Determine the page title based on route
  function getPageTitle(): string {
    const path = location.pathname;
    if (path === "/") return "Dashboard";
    if (path.startsWith("/projects")) return "Projects";
    if (path.startsWith("/calendars")) return "Calendars";
    if (path.startsWith("/chalkboards")) return "Chalk Boards";
    if (path.startsWith("/settings")) return "Settings";
    return "Dashboard";
  }

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-surface px-6">
      <div className="flex items-center gap-3 min-w-0">
        {isOnBoardPage ? (
          <>
            <button
              type="button"
              onClick={() => navigate("/")}
              className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-foreground/60 transition-colors hover:bg-background hover:text-foreground flex-shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Dashboard</span>
            </button>
            <div className="h-5 w-px bg-border flex-shrink-0" />
            <h2 className="text-sm font-semibold text-foreground truncate">
              {boardName ?? "Note Board"}
            </h2>
          </>
        ) : (
          <h2 className="text-sm font-semibold text-foreground">{getPageTitle()}</h2>
        )}
      </div>

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
