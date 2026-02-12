import { useCallback, useEffect, useRef, useState } from "react";
import { Outlet } from "react-router-dom";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";

/** Tailwind `lg` breakpoint — sidebar auto-collapses below this width */
const SIDEBAR_BREAKPOINT = 1024;

export interface OpenedBoard {
  id: string;
  name: string;
  boardType: string;
}

export interface AppLayoutContext {
  setBoardName: (name: string | null) => void;
  openBoard: (board: OpenedBoard) => void;
  closeBoard: (id: string) => void;
  openedBoards: OpenedBoard[];
}

export function AppLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => window.innerWidth >= SIDEBAR_BREAKPOINT);
  const [boardName, setBoardName] = useState<string | null>(null);
  const [openedBoards, setOpenedBoards] = useState<OpenedBoard[]>([]);

  /** Track whether the user has manually toggled the sidebar since the last
   *  automatic resize change. When the breakpoint triggers we reset this flag
   *  so the auto-behaviour takes over again on the next cross. */
  const userToggledRef = useRef(false);

  /* ── Auto-collapse / expand on viewport resize ──────────── */
  useEffect(() => {
    const mql = window.matchMedia(`(min-width: ${SIDEBAR_BREAKPOINT}px)`);

    function handleChange(e: MediaQueryListEvent | MediaQueryList) {
      // Always auto-set on breakpoint cross; reset the manual flag
      userToggledRef.current = false;
      setIsSidebarOpen(e.matches);
    }

    // Set initial state
    handleChange(mql);

    mql.addEventListener("change", handleChange);
    return () => mql.removeEventListener("change", handleChange);
  }, []);

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

  const outletContext: AppLayoutContext = {
    setBoardName,
    openBoard,
    closeBoard,
    openedBoards,
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <Sidebar
        isOpen={isSidebarOpen}
        onToggle={handleToggleSidebar}
        openedBoards={openedBoards}
        onCloseBoard={closeBoard}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar boardName={boardName} />
        <main className="flex-1 overflow-auto p-4">
          <Outlet context={outletContext} />
        </main>
      </div>
    </div>
  );
}
