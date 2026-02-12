import { useCallback, useState } from "react";
import { Outlet } from "react-router-dom";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";

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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [boardName, setBoardName] = useState<string | null>(null);
  const [openedBoards, setOpenedBoards] = useState<OpenedBoard[]>([]);

  function handleToggleSidebar() {
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
