import { Menu } from "lucide-react";

interface NavbarProps {
  onMenuClick: () => void;
}

export function Navbar({ onMenuClick }: NavbarProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-surface">
      <div className="mx-auto flex h-14 w-full max-w-screen-2xl items-center justify-between px-4">
        <button
          type="button"
          onClick={onMenuClick}
          className="inline-flex items-center gap-2 rounded-md border border-border px-2 py-1 text-sm hover:bg-background"
          aria-label="Toggle sidebar"
        >
          <Menu className="h-4 w-4" />
          <span>Menu</span>
        </button>
        <span className="text-sm font-semibold tracking-wide">TableWorks</span>
      </div>
    </header>
  );
}
