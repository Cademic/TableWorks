import { useRef, useState, useEffect } from "react";
import { ArrowLeft, BookOpen, User, Settings, LogOut, ChevronDown, Menu } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getAvatarUrl } from "../../constants/avatars";

interface NavbarProps {
  /** Board name to display when viewing a board page */
  boardName?: string | null;
  /** Called when hamburger is clicked (mobile only) */
  onToggleSidebar?: () => void;
  /** Show hamburger menu button (true when viewport is below sidebar breakpoint) */
  showMenuButton?: boolean;
}

const PAGE_META: Record<string, { label: string; icon: typeof BookOpen }> = {
  "/dashboard": { label: "Dashboard", icon: BookOpen },
  "/profile": { label: "Profile", icon: BookOpen },
  "/projects": { label: "Projects", icon: BookOpen },
  "/calendar": { label: "Calendar", icon: BookOpen },
  "/chalkboards": { label: "Chalk Boards", icon: BookOpen },
  "/settings": { label: "Settings", icon: BookOpen },
};

export function Navbar({ boardName, onToggleSidebar, showMenuButton }: NavbarProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isOnBoardPage = location.pathname.startsWith("/boards/");

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [dropdownOpen]);

  function getPageTitle(): string {
    for (const [path, meta] of Object.entries(PAGE_META)) {
      if (path === "/dashboard" && location.pathname === "/dashboard") return meta.label;
      if (path !== "/dashboard" && location.pathname.startsWith(path)) return meta.label;
    }
    return "Dashboard";
  }

  const userInitial = user?.username?.charAt(0).toUpperCase() ?? "?";
  const avatarUrl = user?.profilePictureKey ? getAvatarUrl(user.profilePictureKey) : null;

  return (
    <header className="navbar-surface flex h-14 items-center justify-between px-4 sm:px-6">
      {/* Left: Hamburger (mobile) + Page context / breadcrumb */}
      <div className="flex items-center gap-2 min-w-0">
        {showMenuButton && onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className="flex shrink-0 items-center justify-center rounded-lg p-2 text-foreground/70 transition-colors hover:bg-foreground/5 hover:text-foreground"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        {isOnBoardPage ? (
          <>
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
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

      {/* Right: User menu dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setDropdownOpen((open) => !open)}
          className="flex items-center gap-2 rounded-lg px-1.5 py-1 transition-colors hover:bg-foreground/5"
          aria-expanded={dropdownOpen}
          aria-haspopup="true"
          aria-label="User menu"
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt=""
              className="h-8 w-8 rounded-full object-cover ring-1 ring-border/50"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
              {userInitial}
            </div>
          )}
          {user && (
            <span className="hidden text-xs font-medium text-foreground/50 sm:block">
              {user.username}
            </span>
          )}
          <ChevronDown
            className={`h-3.5 w-3.5 text-foreground/40 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
            aria-hidden
          />
        </button>

        {dropdownOpen && (
          <div
            className="absolute right-0 top-full z-50 mt-1 min-w-[160px] rounded-lg border border-border bg-background py-1 shadow-lg"
            role="menu"
          >
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setDropdownOpen(false);
                navigate(user?.username ? `/profile/${encodeURIComponent(user.username)}` : "/profile");
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-foreground hover:bg-foreground/5"
            >
              <User className="h-4 w-4 text-foreground/60" />
              Profile
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setDropdownOpen(false);
                navigate("/settings");
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-foreground hover:bg-foreground/5"
            >
              <Settings className="h-4 w-4 text-foreground/60" />
              Settings
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setDropdownOpen(false);
                logout();
                navigate("/", { replace: true });
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-500/10 dark:text-red-400"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
