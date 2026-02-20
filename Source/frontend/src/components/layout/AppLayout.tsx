import { useCallback, useEffect, useRef, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { getPinnedBoards } from "../../api/boards";
import { getPinnedProjects } from "../../api/projects";
import { getPinnedNotebooks } from "../../api/notebooks";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";
import { useAuth } from "../../context/AuthContext";
import type { BoardSummaryDto, NotebookSummaryDto, ProjectSummaryDto } from "../../types";

/** Tailwind `lg` breakpoint — below this: sidebar becomes hamburger drawer */
const SIDEBAR_BREAKPOINT = 1024;

export interface OpenedBoard {
  id: string;
  name: string;
  boardType: string;
}

export interface BoardPresenceUser {
  userId: string;
  displayName: string;
}

export interface AppLayoutContext {
  setBoardName: (name: string | null) => void;
  openBoard: (board: OpenedBoard) => void;
  closeBoard: (id: string) => void;
  openedBoards: OpenedBoard[];
  /** Connected users on the current board (when on a board route). Cleared when leaving board. */
  connectedUsers: BoardPresenceUser[];
  setBoardPresence: (users: BoardPresenceUser[]) => void;
  refreshPinnedBoards: () => void;
  refreshPinnedProjects: () => void;
  openNotebook: (id: string) => void;
  refreshPinnedNotebooks: () => void;
  /** Desktop only: true when sidebar is expanded (w-60), false when collapsed (w-16). */
  isSidebarOpen: boolean;
}

export function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => window.innerWidth >= SIDEBAR_BREAKPOINT);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < SIDEBAR_BREAKPOINT);
  const [boardName, setBoardName] = useState<string | null>(null);
  const [connectedUsers, setBoardPresence] = useState<BoardPresenceUser[]>([]);
  const [openedBoards, setOpenedBoards] = useState<OpenedBoard[]>([]);
  const [pinnedBoards, setPinnedBoards] = useState<BoardSummaryDto[]>([]);
  const [pinnedProjects, setPinnedProjects] = useState<ProjectSummaryDto[]>([]);
  const [pinnedNotebooks, setPinnedNotebooks] = useState<NotebookSummaryDto[]>([]);

  /** Track whether the user has manually toggled the sidebar since the last
   *  automatic resize change. When the breakpoint triggers we reset this flag
   *  so the auto-behaviour takes over again on the next cross. */
  const userToggledRef = useRef(false);

  /* ── Mobile vs desktop: hamburger drawer vs inline sidebar ──────────── */
  useEffect(() => {
    const mql = window.matchMedia(`(min-width: ${SIDEBAR_BREAKPOINT}px)`);

    function handleChange(e: MediaQueryListEvent | MediaQueryList) {
      const desktop = e.matches;
      setIsMobile(!desktop);
      userToggledRef.current = false;
      setIsSidebarOpen(desktop);
    }

    handleChange(mql);
    mql.addEventListener("change", handleChange);
    return () => mql.removeEventListener("change", handleChange);
  }, []);

  /* ── Close mobile drawer on route change ──────────── */
  useEffect(() => {
    if (isMobile) setIsSidebarOpen(false);
  }, [isMobile, location.pathname]);

  function handleToggleSidebar() {
    userToggledRef.current = true;
    setIsSidebarOpen((value) => !value);
  }

  const openBoard = useCallback((board: OpenedBoard) => {
    setOpenedBoards((prev) => {
      // Update if already open (name may have changed), otherwise add
      const exists = prev.find((b) => b.id === board.id);
      if (exists) {
        return prev.map((b) => (b.id === board.id ? board : b));
      }
      return [...prev, board];
    });
  }, []);

  const closeBoard = useCallback((id: string) => {
    setOpenedBoards((prev) => prev.filter((b) => b.id !== id));
  }, []);

  const refreshPinnedBoards = useCallback(async () => {
    try {
      const result = await getPinnedBoards();
      setPinnedBoards(result);
    } catch {
      // Fail silently
    }
  }, []);

  const refreshPinnedProjects = useCallback(async () => {
    try {
      const result = await getPinnedProjects();
      setPinnedProjects(result);
    } catch {
      // Fail silently
    }
  }, []);

  const refreshPinnedNotebooks = useCallback(async () => {
    try {
      const result = await getPinnedNotebooks();
      setPinnedNotebooks(result);
    } catch {
      // Fail silently
    }
  }, []);

  const openNotebook = useCallback(
    (id: string) => {
      navigate(`/notebooks/${id}`);
    },
    [navigate],
  );

  // Clear presence when leaving board or notebook editor routes
  useEffect(() => {
    const onBoard = /^\/boards\/[^/]+$/.test(location.pathname) || /^\/chalkboards\/[^/]+$/.test(location.pathname);
    const onNotebookEditor = /^\/notebooks\/[^/]+$/.test(location.pathname);
    if (!onBoard && !onNotebookEditor) setBoardPresence([]);
  }, [location.pathname]);

  // Fetch pinned boards, projects, and notebooks when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;
    refreshPinnedBoards();
    refreshPinnedProjects();
    refreshPinnedNotebooks();
  }, [isAuthenticated, refreshPinnedBoards, refreshPinnedProjects, refreshPinnedNotebooks]);

  const outletContext: AppLayoutContext = {
    setBoardName,
    openBoard,
    closeBoard,
    openedBoards,
    connectedUsers,
    setBoardPresence,
    refreshPinnedBoards,
    refreshPinnedProjects,
    openNotebook,
    refreshPinnedNotebooks,
    isSidebarOpen,
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      {/* Desktop: sidebar in flow; mobile: sidebar only as overlay when open */}
      {!isMobile && (
        <Sidebar
          isOpen={isSidebarOpen}
          onToggle={handleToggleSidebar}
          isDrawer={false}
          openedBoards={openedBoards}
          onCloseBoard={closeBoard}
          pinnedBoards={pinnedBoards}
          pinnedProjects={pinnedProjects}
          pinnedNotebooks={pinnedNotebooks}
          onOpenNotebook={openNotebook}
        />
      )}
      {isMobile && isSidebarOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/50"
            onClick={handleToggleSidebar}
            aria-label="Close menu"
          />
          <div className="fixed left-0 top-0 bottom-0 z-50 w-60 shadow-xl">
            <Sidebar
              isOpen
              onToggle={handleToggleSidebar}
              isDrawer
              openedBoards={openedBoards}
              onCloseBoard={closeBoard}
              pinnedBoards={pinnedBoards}
              pinnedProjects={pinnedProjects}
              pinnedNotebooks={pinnedNotebooks}
              onOpenNotebook={openNotebook}
            />
          </div>
        </>
      )}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <Navbar
          boardName={boardName}
          connectedUsers={connectedUsers}
          onToggleSidebar={isMobile ? handleToggleSidebar : undefined}
          showMenuButton={isMobile}
        />
        <main className="flex-1 overflow-auto p-4">
          <Outlet context={outletContext} />
        </main>
      </div>
    </div>
  );
}
