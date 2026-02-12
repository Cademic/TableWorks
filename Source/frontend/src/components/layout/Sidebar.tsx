import {
  LayoutDashboard,
  StickyNote,
  FolderOpen,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  PenTool,
  Calendar,
  Notebook,
} from "lucide-react";
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

const BOARD_TOOLS = [
  {
    type: "sticky-note",
    icon: StickyNote,
    label: "Sticky Note",
    iconColor: "text-yellow-600 dark:text-yellow-400",
    swatchColor: "bg-yellow-400",
  },
  {
    type: "index-card",
    icon: CreditCard,
    label: "Index Card",
    iconColor: "text-sky-600 dark:text-sky-400",
    swatchColor: "bg-sky-400",
  },
];

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const location = useLocation();
  const { user, logout } = useAuth();

  const isOnBoardPage = location.pathname.startsWith("/boards/");

  function isActive(path: string) {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  }

  return (
    <aside
      className={[
        "sidebar-surface relative flex h-screen flex-col transition-all duration-200",
        isOpen ? "w-60" : "w-16",
      ].join(" ")}
    >
      {/* Brand — Notebook cover */}
      <div className="sidebar-brand flex h-14 items-center px-4">
        {isOpen ? (
          <div className="flex items-center gap-2.5">
            <Notebook className="h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
            <span className="text-lg font-bold tracking-tight text-foreground">
              TableWorks
            </span>
          </div>
        ) : (
          <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/40">
            <span className="text-sm font-bold text-amber-700 dark:text-amber-400">TW</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-0.5 p-3">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              title={item.label}
              className={[
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
                active
                  ? "sidebar-nav-active bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                  : "text-foreground/60 hover:bg-foreground/[0.04] hover:text-foreground",
                !isOpen && "justify-center",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <item.icon
                className={`h-5 w-5 flex-shrink-0 ${
                  active ? "text-amber-600 dark:text-amber-400" : ""
                }`}
              />
              {isOpen && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Board Tools — draggable stationery items */}
      {isOnBoardPage && (
        <div className="border-t border-border/40 p-3">
          {isOpen && (
            <span className="mb-1.5 block px-3 text-[10px] font-semibold uppercase tracking-wider text-foreground/35">
              Board Tools
            </span>
          )}
          <div className="flex flex-col gap-0.5">
            {BOARD_TOOLS.map((tool) => (
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
                  "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-foreground/60 transition-all hover:bg-foreground/[0.04] hover:text-foreground",
                  !isOpen && "justify-center",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <div className="relative flex-shrink-0">
                  <tool.icon className={`h-5 w-5 ${tool.iconColor}`} />
                  <div
                    className={`sidebar-tool-swatch ${tool.swatchColor}`}
                  />
                </div>
                {isOpen && <span>{tool.label}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* User section */}
      <div className="border-t border-border/40 p-3">
        {isOpen && user && (
          <div className="mb-2 truncate px-3 text-[10px] font-semibold uppercase tracking-wider text-foreground/35">
            {user.username}
          </div>
        )}
        <button
          type="button"
          onClick={logout}
          title="Sign out"
          className={[
            "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-foreground/60 transition-all hover:bg-red-50/80 hover:text-red-600 dark:hover:bg-red-950/20 dark:hover:text-red-400",
            !isOpen && "justify-center",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          {isOpen && <span>Sign Out</span>}
        </button>
      </div>

      {/* Collapse toggle — amber tinted */}
      <button
        type="button"
        onClick={onToggle}
        className="absolute -right-3 top-[4.25rem] z-10 flex h-6 w-6 items-center justify-center rounded-full border border-border/50 bg-amber-50 text-amber-700/60 shadow-sm transition-all hover:bg-amber-100 hover:text-amber-800 dark:bg-amber-950/60 dark:text-amber-400/60 dark:hover:bg-amber-900/50 dark:hover:text-amber-300"
        aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
      >
        {isOpen ? (
          <ChevronLeft className="h-3.5 w-3.5" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5" />
        )}
      </button>
    </aside>
  );
}
