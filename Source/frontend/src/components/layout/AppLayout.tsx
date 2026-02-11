import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";

export interface AppLayoutContext {
  setBoardName: (name: string | null) => void;
}

export function AppLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [boardName, setBoardName] = useState<string | null>(null);

  function handleToggleSidebar() {
    setIsSidebarOpen((value) => !value);
  }

  const outletContext: AppLayoutContext = { setBoardName };

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <Sidebar isOpen={isSidebarOpen} onToggle={handleToggleSidebar} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar boardName={boardName} />
        <main className="flex-1 overflow-auto p-4">
          <Outlet context={outletContext} />
        </main>
      </div>
    </div>
  );
}
