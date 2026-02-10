import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";

export function AppLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  function handleToggleSidebar() {
    setIsSidebarOpen((value) => !value);
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar onMenuClick={handleToggleSidebar} />
      <div className="mx-auto flex w-full max-w-screen-2xl">
        <Sidebar isOpen={isSidebarOpen} />
        <main className="min-h-[calc(100vh-3.5rem)] flex-1 p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
