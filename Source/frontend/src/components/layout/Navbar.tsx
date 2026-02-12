import { Moon, Sun, Monitor, ArrowLeft, BookOpen } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useThemeContext, type ThemeMode } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";

interface NavbarProps {
  /** Board name to display when viewing a board page */
  boardName?: string | null;
}

const PAGE_META: Record<string, { label: string; icon: typeof BookOpen }> = {
  "/": { label: "Dashboard", icon: BookOpen },
  "/projects": { label: "Projects", icon: BookOpen },
  "/calendars": { label: "Calendars", icon: BookOpen },
  "/chalkboards": { label: "Chalk Boards", icon: BookOpen },
  "/settings": { label: "Settings", icon: BookOpen },
};

export function Navbar({ boardName }: NavbarProps) {
  const { themeMode, setThemeMode } = useThemeContext();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isOnBoardPage = location.pathname.startsWith("/boards/");

  function getPageTitle(): string {
    for (const [path, meta] of Object.entries(PAGE_META)) {
      if (path === "/" && location.pathname === "/") return meta.label;
      if (path !== "/" && location.pathname.startsWith(path)) return meta.label;
    }
    return "Dashboard";
  }

  const userInitial = user?.username?.charAt(0).toUpperCase() ?? "?";

  return (
    <header className="navbar-surface flex h-14 items-center justify-between px-6">
      {/* Left: Page context / breadcrumb */}
      <div className="flex items-center gap-2 min-w-0">
        {isOnBoardPage ? (
          <>
            <button
              type="button"
              onClick={() => navigate("/")}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-foreground/50 transition-all hover:bg-foreground/5 hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Dashboard</span>
            </button>
            <span className="text-sm text-foreground/20 select-none">/</span>
            <h2 className="text-sm font-semibold text-foreground truncate">
              {boardName ?? "Note Board"}
            </h2>
          </>
        ) : (
          <h2 className="text-sm font-semibold text-foreground">{getPageTitle()}</h2>
        )}
      </div>

      {/* Right: Theme toggle + user */}
      <div className="flex items-center gap-3">
        {/* Theme segmented control */}
        <ThemeSegmentedControl themeMode={themeMode} onSetTheme={setThemeMode} />

        {/* Separator */}
        <div className="h-5 w-px bg-border/60" />

        {/* User avatar */}
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
            {userInitial}
          </div>
          {user && (
            <span className="hidden text-xs font-medium text-foreground/50 sm:block">
              {user.username}
            </span>
          )}
        </div>
      </div>
    </header>
  );
}

/* ─── Theme segmented control ──────────────────────────── */

interface ThemeSegmentedControlProps {
  themeMode: ThemeMode;
  onSetTheme: (mode: ThemeMode) => void;
}

const THEME_OPTIONS: Array<{ mode: ThemeMode; icon: typeof Sun; label: string }> = [
  { mode: "light", icon: Sun, label: "Light" },
  { mode: "dark", icon: Moon, label: "Dark" },
  { mode: "system", icon: Monitor, label: "System" },
];

function ThemeSegmentedControl({ themeMode, onSetTheme }: ThemeSegmentedControlProps) {
  return (
    <div className="theme-segment">
      {THEME_OPTIONS.map(({ mode, icon: Icon, label }) => (
        <button
          key={mode}
          type="button"
          onClick={() => onSetTheme(mode)}
          title={label}
          className={`theme-segment-btn ${themeMode === mode ? "active" : ""}`}
          aria-label={`Switch to ${label} theme`}
        >
          <Icon className="h-3.5 w-3.5" />
        </button>
      ))}
    </div>
  );
}
