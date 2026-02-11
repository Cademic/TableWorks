import { LayoutDashboard, StickyNote, FolderOpen, Settings, LogOut, ChevronLeft, ChevronRight } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const NAV_ITEMS = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/notes", icon: StickyNote, label: "Notes" },
  { to: "/projects", icon: FolderOpen, label: "Projects" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const location = useLocation();
  const { user, logout } = useAuth();

  function isActive(path: string) {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  }

  return (
    <aside
      className={[
        "relative flex h-screen flex-col border-r border-border bg-surface transition-all duration-200",
        isOpen ? "w-60" : "w-16",
      ].join(" ")}
    >
      {/* Brand */}
      <div className="flex h-14 items-center border-b border-border px-4">
        {isOpen ? (
          <span className="text-lg font-bold tracking-tight text-foreground">TableWorks</span>
        ) : (
          <span className="mx-auto text-lg font-bold text-primary">TW</span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              title={item.label}
              className={[
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-foreground/70 hover:bg-background hover:text-foreground",
                !isOpen && "justify-center",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {isOpen && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="border-t border-border p-3">
        {isOpen && user && (
          <div className="mb-2 truncate px-3 text-xs text-foreground/50">
            {user.username}
          </div>
        )}
        <button
          type="button"
          onClick={logout}
          title="Sign out"
          className={[
            "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-foreground/70 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20 dark:hover:text-red-400",
            !isOpen && "justify-center",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          {isOpen && <span>Sign Out</span>}
        </button>
      </div>

      {/* Toggle button */}
      <button
        type="button"
        onClick={onToggle}
        className="absolute -right-3 top-[4.25rem] z-10 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-surface text-foreground/60 shadow-sm transition-colors hover:bg-background hover:text-foreground"
        aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
      >
        {isOpen ? <ChevronLeft className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
      </button>
    </aside>
  );
}
