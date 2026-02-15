import {
  LayoutDashboard,
  StickyNote,
  FolderOpen,
  Settings,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Calendar,
  X,
  ClipboardList,
  PenTool,
  Pin,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import type { OpenedBoard } from "./AppLayout";
import type { BoardSummaryDto, ProjectSummaryDto } from "../../types";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  openedBoards: OpenedBoard[];
  onCloseBoard: (id: string) => void;
  pinnedBoards: BoardSummaryDto[];
  pinnedProjects: ProjectSummaryDto[];
}

const NAV_ITEMS = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/projects", icon: FolderOpen, label: "Projects" },
  { to: "/calendar", icon: Calendar, label: "Calendar" },
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

const BOARD_TYPE_ICON: Record<string, typeof ClipboardList> = {
  NoteBoard: ClipboardList,
  ChalkBoard: PenTool,
  Calendar: Calendar,
};

function getBoardPath(board: OpenedBoard): string {
  if (board.boardType === "ChalkBoard") return `/chalkboards/${board.id}`;
  return `/boards/${board.id}`;
}

export function Sidebar({ isOpen, onToggle, openedBoards, onCloseBoard, pinnedBoards, pinnedProjects }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const isOnBoardPage = location.pathname.startsWith("/boards/");
  const isOnChalkBoardPage = location.pathname.startsWith("/chalkboards/") && location.pathname !== "/chalkboards";
  const isOnAnyBoardPage = isOnBoardPage || isOnChalkBoardPage;

  // Don't show pinned boards in the "Opened Boards" section
  const pinnedIds = new Set(pinnedBoards.map((b) => b.id));
  const filteredOpenedBoards = openedBoards.filter((b) => !pinnedIds.has(b.id));

  function isActive(path: string) {
    if (path === "/dashboard") return location.pathname === "/dashboard";
    return location.pathname.startsWith(path);
  }

  function isBoardActive(board: OpenedBoard): boolean {
    const boardPath = getBoardPath(board);
    return location.pathname === boardPath;
  }

  function handleCloseBoard(e: React.MouseEvent, board: OpenedBoard) {
    e.preventDefault();
    e.stopPropagation();
    const wasActive = isBoardActive(board);
    onCloseBoard(board.id);
    // If closing the currently viewed board, navigate to dashboard
    if (wasActive) {
      navigate("/dashboard");
    }
  }

  return (
    <aside
      className={[
        "sidebar-surface relative flex h-screen flex-col transition-all duration-200",
        isOpen ? "w-60" : "w-16",
      ].join(" ")}
    >
      {/* Brand — logo */}
      <div className="sidebar-brand flex h-14 items-center justify-center px-4">
        <Link
          to="/"
          className="flex shrink-0 items-center justify-center"
          title="ASideNote"
        >
          <img
            src={isOpen ? "/asidenote-logo.png" : "/asidenote-logo-square.png"}
            alt="ASideNote"
            className={["shrink-0 object-contain", isOpen ? "h-14 w-auto" : "h-12 w-12"].join(" ")}
          />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-0.5 p-3">
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

      {/* Pinned Projects */}
      {pinnedProjects.length > 0 && (
        <div className="flex flex-col border-t border-border/40 overflow-hidden">
          {isOpen && (
            <span className="px-6 pt-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/35 flex-shrink-0 flex items-center gap-1">
              <FolderOpen className="h-3 w-3" />
              Pinned Projects
            </span>
          )}
          {!isOpen && (
            <span className="pt-3 pb-1 text-center text-[9px] font-semibold uppercase tracking-wider text-foreground/30 flex-shrink-0">
              <FolderOpen className="mx-auto h-3 w-3" />
            </span>
          )}
          <div className="overflow-y-auto px-3 pb-2 flex flex-col gap-0.5 max-h-36 scrollbar-thin">
            {pinnedProjects.map((project) => {
              const projectPath = `/projects/${project.id}`;
              const active = location.pathname === projectPath;
              return (
                <Link
                  key={project.id}
                  to={projectPath}
                  title={project.name}
                  className={[
                    "group flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-sm transition-all duration-150",
                    active
                      ? "bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                      : "text-foreground/60 hover:bg-foreground/[0.04] hover:text-foreground",
                    !isOpen && "justify-center",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <FolderOpen
                    className={`h-4 w-4 flex-shrink-0 ${
                      active ? "text-amber-600 dark:text-amber-400" : "text-foreground/40"
                    }`}
                  />
                  {isOpen && (
                    <span className="flex-1 truncate text-xs font-medium">{project.name}</span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Pinned Boards */}
      {pinnedBoards.length > 0 && (
        <div className="flex flex-col border-t border-border/40 overflow-hidden">
          {isOpen && (
            <span className="px-6 pt-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/35 flex-shrink-0 flex items-center gap-1">
              <Pin className="h-3 w-3" />
              Pinned Boards
            </span>
          )}
          {!isOpen && (
            <span className="pt-3 pb-1 text-center text-[9px] font-semibold uppercase tracking-wider text-foreground/30 flex-shrink-0">
              <Pin className="mx-auto h-3 w-3" />
            </span>
          )}
          <div className="overflow-y-auto px-3 pb-2 flex flex-col gap-0.5 max-h-36 scrollbar-thin">
            {pinnedBoards.map((board) => {
              const boardPath = board.boardType === "ChalkBoard" ? `/chalkboards/${board.id}` : `/boards/${board.id}`;
              const active = location.pathname === boardPath;
              const BoardIcon = BOARD_TYPE_ICON[board.boardType] ?? ClipboardList;
              return (
                <Link
                  key={board.id}
                  to={boardPath}
                  title={board.name}
                  className={[
                    "group flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-sm transition-all duration-150",
                    active
                      ? "bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                      : "text-foreground/60 hover:bg-foreground/[0.04] hover:text-foreground",
                    !isOpen && "justify-center",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <BoardIcon
                    className={`h-4 w-4 flex-shrink-0 ${
                      active ? "text-amber-600 dark:text-amber-400" : "text-foreground/40"
                    }`}
                  />
                  {isOpen && (
                    <span className="flex-1 truncate text-xs font-medium">{board.name}</span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Opened Boards */}
      {filteredOpenedBoards.length > 0 && (
        <div className="flex flex-col border-t border-border/40 overflow-hidden">
          {isOpen && (
            <span className="px-6 pt-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/35 flex-shrink-0">
              Opened Boards
            </span>
          )}
          {!isOpen && (
            <span className="pt-3 pb-1 text-center text-[9px] font-semibold uppercase tracking-wider text-foreground/30 flex-shrink-0">
              Open
            </span>
          )}
          <div className="overflow-y-auto px-3 pb-2 flex flex-col gap-0.5 max-h-48 scrollbar-thin">
            {filteredOpenedBoards.map((board) => {
              const active = isBoardActive(board);
              const Icon = BOARD_TYPE_ICON[board.boardType] ?? ClipboardList;
              return (
                <Link
                  key={board.id}
                  to={getBoardPath(board)}
                  title={board.name}
                  className={[
                    "group flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-sm transition-all duration-150",
                    active
                      ? "bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                      : "text-foreground/60 hover:bg-foreground/[0.04] hover:text-foreground",
                    !isOpen && "justify-center",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <Icon
                    className={`h-4 w-4 flex-shrink-0 ${
                      active ? "text-amber-600 dark:text-amber-400" : "text-foreground/40"
                    }`}
                  />
                  {isOpen && (
                    <>
                      <span className="flex-1 truncate text-xs font-medium">{board.name}</span>
                      <button
                        type="button"
                        onClick={(e) => handleCloseBoard(e, board)}
                        className="flex-shrink-0 rounded p-0.5 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-foreground/10"
                        title="Close board"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Spacer to push board tools and user section to bottom */}
      <div className="flex-1" />

      {/* Board Tools — draggable stationery items */}
      {isOnAnyBoardPage && (
        <div className="border-t border-border/40 p-3">
          {isOpen && (
            <span className="mb-1.5 block px-3 text-[10px] font-semibold uppercase tracking-wider text-foreground/35">
              Board Tools
            </span>
          )}
          <div className="flex flex-col gap-0.5">
            {(isOnChalkBoardPage
              ? BOARD_TOOLS.filter((t) => t.type === "sticky-note")
              : BOARD_TOOLS
            ).map((tool) => (
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
          <button
            type="button"
            onClick={() => navigate("/profile")}
            className="block w-full truncate px-3 text-left text-[10px] font-semibold uppercase tracking-wider text-foreground/35 transition-colors hover:text-foreground/60"
          >
            {user.username}
          </button>
        )}
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
