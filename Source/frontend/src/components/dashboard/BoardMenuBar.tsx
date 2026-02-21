import { useEffect, useRef, useState } from "react";
import { Save, Upload, ChevronRight, StickyNote as StickyNoteIcon, CreditCard, Image as ImageIcon } from "lucide-react";

const ZOOM_PRESETS = [50, 75, 100, 125, 150, 200];

type OpenMenu = "file" | "edit" | "insert" | "view" | null;
export type BoardBackgroundTheme = "whiteboard" | "blackboard" | "default";

interface BoardMenuBarProps {
  boardType: "NoteBoard" | "ChalkBoard";
  zoom: number;
  onZoomChange: (zoom: number) => void;
  onSaveToFile: () => void;
  onLoadFromFile: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onInsertStickyNote: () => void;
  onInsertIndexCard?: () => void;
  onInsertImage?: () => void;
  backgroundTheme: BoardBackgroundTheme;
  onBackgroundThemeChange: (theme: BoardBackgroundTheme) => void;
  autoEnlargeNotes: boolean;
  onAutoEnlargeNotesChange: (enabled: boolean) => void;
}

const menuItemClass =
  "w-full px-3 py-1.5 text-left text-sm transition-colors hover:bg-amber-50 hover:text-foreground dark:hover:bg-amber-900/20 flex items-center gap-2";
const menuItemWithSubmenuClass =
  "w-full px-3 py-1.5 text-left text-sm transition-colors hover:bg-amber-50 hover:text-foreground dark:hover:bg-amber-900/20 flex items-center justify-between gap-2";
const dividerClass = "my-1 border-t border-border/50";
const submenuClass =
  "absolute left-full top-0 -ml-1 pl-1 z-[60] min-w-[160px] rounded-lg border border-border bg-background py-1 shadow-xl";

function HoverSubmenu({
  label,
  children,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearCloseTimer = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };
  useEffect(() => () => clearCloseTimer(), []);
  return (
    <div
      className="relative"
      onMouseEnter={() => {
        clearCloseTimer();
        setOpen(true);
      }}
      onMouseLeave={() => {
        closeTimerRef.current = setTimeout(() => setOpen(false), 150);
      }}
    >
      <div className={menuItemWithSubmenuClass}>
        {label}
        <ChevronRight className="h-3.5 w-3.5 shrink-0" />
      </div>
      {open && (
        <div
          className={submenuClass}
          onMouseEnter={() => {
            clearCloseTimer();
            setOpen(true);
          }}
          onMouseLeave={() => {
            closeTimerRef.current = setTimeout(() => setOpen(false), 150);
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export function BoardMenuBar({
  boardType,
  zoom,
  onZoomChange,
  onSaveToFile,
  onLoadFromFile,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onInsertStickyNote,
  onInsertIndexCard,
  onInsertImage,
  backgroundTheme,
  onBackgroundThemeChange,
  autoEnlargeNotes,
  onAutoEnlargeNotesChange,
}: BoardMenuBarProps) {
  const [openMenu, setOpenMenu] = useState<OpenMenu>(null);
  const menuBarRef = useRef<HTMLDivElement>(null);

  const closeMenu = () => setOpenMenu(null);

  useEffect(() => {
    if (!openMenu) return;
    function onPointerDown(e: PointerEvent) {
      if (menuBarRef.current && !menuBarRef.current.contains(e.target as Node)) {
        closeMenu();
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [openMenu]);

  const menuTriggerClass = (menu: OpenMenu) =>
    `px-3 py-1.5 text-sm transition-colors rounded-md ${
      openMenu === menu
        ? "bg-sky-50 text-sky-800 dark:bg-sky-900/30 dark:text-sky-200"
        : "text-foreground/80 hover:bg-amber-100/50 hover:text-foreground dark:hover:bg-amber-900/20"
    }`;

  const dropdownClass =
    "absolute left-0 top-full z-50 mt-1 min-w-[200px] max-w-[280px] overflow-visible rounded-lg border border-border bg-background py-1 shadow-xl";

  return (
    <div ref={menuBarRef} className="flex items-center gap-1 px-2 py-1.5">
      {/* File */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpenMenu(openMenu === "file" ? null : "file")}
          className={menuTriggerClass("file")}
        >
          File
        </button>
        {openMenu === "file" && (
          <div className={dropdownClass}>
            <button
              type="button"
              className={menuItemClass}
              onClick={() => {
                closeMenu();
                onSaveToFile();
              }}
            >
              <Save className="h-3.5 w-3.5" />
              Save to file
            </button>
            <button
              type="button"
              className={menuItemClass}
              onClick={() => {
                closeMenu();
                onLoadFromFile();
              }}
            >
              <Upload className="h-3.5 w-3.5" />
              Load from file
            </button>
          </div>
        )}
      </div>

      {/* Edit */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpenMenu(openMenu === "edit" ? null : "edit")}
          className={menuTriggerClass("edit")}
        >
          Edit
        </button>
        {openMenu === "edit" && (
          <div className={dropdownClass}>
            <button
              type="button"
              className={menuItemClass}
              onClick={() => {
                closeMenu();
                onUndo();
              }}
              disabled={!canUndo}
            >
              Undo
              <span className="ml-auto text-xs text-foreground/50">Ctrl+Z</span>
            </button>
            <button
              type="button"
              className={menuItemClass}
              onClick={() => {
                closeMenu();
                onRedo();
              }}
              disabled={!canRedo}
            >
              Redo
              <span className="ml-auto text-xs text-foreground/50">Ctrl+Y</span>
            </button>
          </div>
        )}
      </div>

      {/* Insert */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpenMenu(openMenu === "insert" ? null : "insert")}
          className={menuTriggerClass("insert")}
        >
          Insert
        </button>
        {openMenu === "insert" && (
          <div className={dropdownClass}>
            <button
              type="button"
              className={menuItemClass}
              onClick={() => {
                closeMenu();
                onInsertStickyNote();
              }}
            >
              <StickyNoteIcon className="h-3.5 w-3.5 text-yellow-500" />
              Sticky Note
            </button>
            {boardType === "NoteBoard" && onInsertIndexCard && (
              <button
                type="button"
                className={menuItemClass}
                onClick={() => {
                  closeMenu();
                  onInsertIndexCard();
                }}
              >
                <CreditCard className="h-3.5 w-3.5 text-sky-500" />
                Index Card
              </button>
            )}
            {boardType === "NoteBoard" && onInsertImage && (
              <button
                type="button"
                className={menuItemClass}
                onClick={() => {
                  closeMenu();
                  onInsertImage();
                }}
              >
                <ImageIcon className="h-3.5 w-3.5 text-emerald-500" />
                Image
              </button>
            )}
          </div>
        )}
      </div>

      {/* View */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpenMenu(openMenu === "view" ? null : "view")}
          className={menuTriggerClass("view")}
        >
          View
        </button>
        {openMenu === "view" && (
          <div className={dropdownClass}>
            <HoverSubmenu label="Background">
              <button
                type="button"
                className={`${menuItemClass} ${backgroundTheme === "whiteboard" ? "bg-sky-50 dark:bg-sky-900/20" : ""}`}
                onClick={() => {
                  closeMenu();
                  onBackgroundThemeChange("whiteboard");
                }}
              >
                WhiteBoard
              </button>
              <button
                type="button"
                className={`${menuItemClass} ${backgroundTheme === "blackboard" ? "bg-sky-50 dark:bg-sky-900/20" : ""}`}
                onClick={() => {
                  closeMenu();
                  onBackgroundThemeChange("blackboard");
                }}
              >
                Blackboard
              </button>
              <div className={dividerClass} />
              <button
                type="button"
                className={`${menuItemClass} ${backgroundTheme === "default" ? "bg-sky-50 dark:bg-sky-900/20" : ""}`}
                onClick={() => {
                  closeMenu();
                  onBackgroundThemeChange("default");
                }}
              >
                Default
              </button>
            </HoverSubmenu>
            <div className={dividerClass} />
            <HoverSubmenu label="Zoom">
              {ZOOM_PRESETS.map((p) => (
                <button
                  key={p}
                  type="button"
                  className={`${menuItemClass} ${Math.round(zoom * 100) === p ? "bg-sky-50 dark:bg-sky-900/20" : ""}`}
                  onClick={() => {
                    closeMenu();
                    onZoomChange(p / 100);
                  }}
                >
                  {p}%
                </button>
              ))}
            </HoverSubmenu>
            <div className={dividerClass} />
            <button
              type="button"
              className={menuItemClass}
              onClick={() => {
                closeMenu();
                onAutoEnlargeNotesChange(!autoEnlargeNotes);
              }}
            >
              <span
                className={`mr-2 inline-block h-4 w-4 rounded border border-current ${
                  autoEnlargeNotes ? "bg-primary" : "bg-transparent"
                }`}
              />
              Auto-enlarge notes on click
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
