import { LayoutDashboard, StickyNote, FolderOpen, Settings, LogOut, ChevronLeft, ChevronRight, CreditCard, PenTool, Calendar } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const NAV_ITEMS = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/projects", icon: FolderOpen, label: "Projects" },
  { to: "/calendars", icon: Calendar, label: "Calendars" },
  { to: "/chalkboards", icon: PenTool, label: "Chalk Boards" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const location = useLocation();
  const { user, logout } = useAuth();

  // Board tools should only show when viewing a board
  const isOnBoardPage = location.pathname.startsWith("/boards/");

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

      {/* Board Tools — draggable items (only visible on board pages) */}
      {isOnBoardPage && (
        <div className="border-t border-border p-3">
          {isOpen && (
            <span className="mb-1 block px-3 text-[10px] font-semibold uppercase tracking-wider text-foreground/40">
              Board Tools
            </span>
          )}
          <div className="flex flex-col gap-1">
            {[
              { type: "sticky-note", icon: StickyNote, label: "Sticky Note", color: "text-yellow-500" },
              { type: "index-card", icon: CreditCard, label: "Index Card", color: "text-sky-500" },
            ].map((tool) => (
              <div
                key={tool.type}
                draggable="true"
                onDragStart={(e) => {
                  e.dataTransfer.setData("application/board-item-type", tool.type);
                  e.dataTransfer.effectAllowed = "copy";

                  const iconEl = e.currentTarget.querySelector("svg");
                  if (iconEl) {
                    e.dataTransfer.setDragImage(iconEl, 12, 12);
                  }
                }}
                onClick={() => {
                  document.dispatchEvent(
                    new CustomEvent("board-tool-click", { detail: { type: tool.type } }),
                  );
                }}
                title={tool.label}
                className={[
                  "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-foreground/70 transition-colors hover:bg-background hover:text-foreground",
                  !isOpen && "justify-center",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <tool.icon className={`h-5 w-5 flex-shrink-0 ${tool.color}`} />
                {isOpen && <span>{tool.label}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

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
