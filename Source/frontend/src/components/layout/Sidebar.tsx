import { Link } from "react-router-dom";

interface SidebarProps {
  isOpen: boolean;
}

export function Sidebar({ isOpen }: SidebarProps) {
  return (
    <aside
      className={[
        "border-r border-border bg-surface transition-all duration-200",
        isOpen ? "w-64" : "w-0 overflow-hidden border-r-0 md:w-16 md:border-r",
      ].join(" ")}
    >
      <nav className="flex h-full flex-col gap-2 p-3 text-sm">
        <Link className="rounded px-2 py-1 hover:bg-background" to="/">
          Dashboard
        </Link>
      </nav>
    </aside>
  );
}
