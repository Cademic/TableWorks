import { useCallback, useEffect, useRef, useState } from "react";
import { Plus, StickyNote as StickyNoteIcon, CreditCard, ChevronUp } from "lucide-react";
import { CorkBoard } from "../components/dashboard/CorkBoard";
import { StickyNote } from "../components/dashboard/StickyNote";
import { IndexCard } from "../components/dashboard/IndexCard";
import { RedStringLayer } from "../components/dashboard/RedStringLayer";
import { getNotes, createNote, patchNote, deleteNote } from "../api/notes";
import {
  getIndexCards,
  createIndexCard,
  patchIndexCard,
  deleteIndexCard,
} from "../api/index-cards";
import type { NoteSummaryDto, IndexCardSummaryDto, NoteConnection } from "../types";

let nextConnectionId = 1;
let nextTempCardId = 1;

export function DashboardPage() {
  const [notes, setNotes] = useState<NoteSummaryDto[]>([]);
  const [indexCards, setIndexCards] = useState<IndexCardSummaryDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);

  // --- Z-index stacking order ---
  const [zIndexMap, setZIndexMap] = useState<Record<string, number>>({});
  const zCounterRef = useRef(1);

  function bringToFront(id: string) {
    const next = zCounterRef.current++;
    setZIndexMap((prev) => ({ ...prev, [id]: next }));
  }

  // --- Red-string linking state ---
  const [connections, setConnections] = useState<NoteConnection[]>([]);
  const [linkingFrom, setLinkingFrom] = useState<string | null>(null);
  const [linkMousePos, setLinkMousePos] = useState<{ x: number; y: number } | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const linkingFromRef = useRef<string | null>(null);
  const addMenuRef = useRef<HTMLDivElement>(null);

  // Keep ref in sync so document listeners can read latest value
  linkingFromRef.current = linkingFrom;

  // Close add menu when clicking outside
  useEffect(() => {
    if (!showAddMenu) return;
    function onClickOutside(e: MouseEvent) {
      if (addMenuRef.current && !addMenuRef.current.contains(e.target as Node)) {
        setShowAddMenu(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [showAddMenu]);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const [notesRes, cardsRes] = await Promise.allSettled([
        getNotes({ limit: 100 }),
        getIndexCards({ limit: 100 }),
      ]);

      if (notesRes.status === "fulfilled") {
        setNotes(notesRes.value.items);
      }
      if (cardsRes.status === "fulfilled") {
        setIndexCards(cardsRes.value.items);
      }

      // Only show error if both failed
      if (notesRes.status === "rejected" && cardsRes.status === "rejected") {
        setError("Failed to load board items.");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Listen for sidebar tool clicks (custom event from Sidebar component)
  useEffect(() => {
    function onToolClick(e: Event) {
      const type = (e as CustomEvent).detail?.type as string | undefined;
      if (type === "sticky-note") {
        handleQuickAddNote();
      } else if (type === "index-card") {
        handleQuickAddCard();
      }
    }
    document.addEventListener("board-tool-click", onToolClick);
    return () => document.removeEventListener("board-tool-click", onToolClick);
  });

  // =============================================
  // Sticky Note handlers
  // =============================================

  async function handleQuickAddNote() {
    setShowAddMenu(false);
    try {
      const positionX = 30 + Math.random() * 400;
      const positionY = 30 + Math.random() * 300;

      const created = await createNote({
        content: "",
        positionX,
        positionY,
      });

      setNotes((prev) => [...prev, created]);
      setEditingNoteId(created.id);
      setEditingCardId(null);
    } catch {
      // Silently fail - user can retry
    }
  }

  async function handleDragStop(id: string, x: number, y: number) {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, positionX: x, positionY: y } : n)),
    );

    try {
      await patchNote(id, { positionX: x, positionY: y });
    } catch {
      // Silently fail
    }
  }

  async function handleSave(id: string, title: string, content: string) {
    setEditingNoteId(null);

    setNotes((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, title: title || null, content } : n,
      ),
    );

    try {
      await patchNote(id, {
        patchTitle: true,
        title: title || null,
        content: content || undefined,
      });
    } catch {
      // Silently fail
    }
  }

  function handleStartEdit(id: string) {
    setEditingNoteId(id);
    setEditingCardId(null);
    bringToFront(id);
  }

  async function handleResize(id: string, width: number, height: number) {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, width, height } : n)),
    );

    try {
      await patchNote(id, { width, height });
    } catch {
      // Silently fail
    }
  }

  async function handleColorChange(id: string, color: string) {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, color } : n)),
    );

    try {
      await patchNote(id, { color });
    } catch {
      // Silently fail
    }
  }

  async function handleRotationChange(id: string, rotation: number) {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, rotation } : n)),
    );

    try {
      await patchNote(id, { rotation });
    } catch {
      // Silently fail
    }
  }

  async function handleDelete(id: string) {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    if (editingNoteId === id) {
      setEditingNoteId(null);
    }
    setConnections((prev) =>
      prev.filter((c) => c.fromNoteId !== id && c.toNoteId !== id),
    );

    try {
      await deleteNote(id);
    } catch {
      fetchData();
    }
  }

  // =============================================
  // Index Card handlers
  // =============================================

  async function handleQuickAddCard() {
    setShowAddMenu(false);
    const positionX = 30 + Math.random() * 300;
    const positionY = 30 + Math.random() * 200;
    const tempId = `temp-card-${nextTempCardId++}`;
    const now = new Date().toISOString();

    // Optimistically create the card in local state so it appears immediately
    const optimisticCard: IndexCardSummaryDto = {
      id: tempId,
      title: null,
      content: "",
      folderId: null,
      projectId: null,
      tags: [],
      createdAt: now,
      updatedAt: now,
      positionX,
      positionY,
      width: null,
      height: null,
      color: null,
      rotation: null,
    };

    setIndexCards((prev) => [...prev, optimisticCard]);
    setEditingCardId(tempId);
    setEditingNoteId(null);

    try {
      const created = await createIndexCard({
        content: "",
        positionX,
        positionY,
      });

      // Replace the temp card with the real one from the backend
      setIndexCards((prev) =>
        prev.map((c) => (c.id === tempId ? created : c)),
      );
      setEditingCardId(created.id);
    } catch {
      // Card stays in local state with temp ID — usable until page refresh
    }
  }

  async function handleCardDragStop(id: string, x: number, y: number) {
    setIndexCards((prev) =>
      prev.map((c) => (c.id === id ? { ...c, positionX: x, positionY: y } : c)),
    );

    try {
      await patchIndexCard(id, { positionX: x, positionY: y });
    } catch {
      // Silently fail
    }
  }

  async function handleCardSave(id: string, title: string, content: string) {
    setEditingCardId(null);

    setIndexCards((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, title: title || null, content } : c,
      ),
    );

    try {
      await patchIndexCard(id, {
        patchTitle: true,
        title: title || null,
        content: content || undefined,
      });
    } catch {
      // Silently fail
    }
  }

  function handleCardStartEdit(id: string) {
    setEditingCardId(id);
    setEditingNoteId(null);
    bringToFront(id);
  }

  async function handleCardResize(id: string, width: number, height: number) {
    setIndexCards((prev) =>
      prev.map((c) => (c.id === id ? { ...c, width, height } : c)),
    );

    try {
      await patchIndexCard(id, { width, height });
    } catch {
      // Silently fail
    }
  }

  async function handleCardColorChange(id: string, color: string) {
    setIndexCards((prev) =>
      prev.map((c) => (c.id === id ? { ...c, color } : c)),
    );

    try {
      await patchIndexCard(id, { color });
    } catch {
      // Silently fail
    }
  }

  async function handleCardRotationChange(id: string, rotation: number) {
    setIndexCards((prev) =>
      prev.map((c) => (c.id === id ? { ...c, rotation } : c)),
    );

    try {
      await patchIndexCard(id, { rotation });
    } catch {
      // Silently fail
    }
  }

  async function handleCardDelete(id: string) {
    setIndexCards((prev) => prev.filter((c) => c.id !== id));
    if (editingCardId === id) {
      setEditingCardId(null);
    }
    setConnections((prev) =>
      prev.filter((c) => c.fromNoteId !== id && c.toNoteId !== id),
    );

    try {
      await deleteIndexCard(id);
    } catch {
      fetchData();
    }
  }

  // =============================================
  // Board drop handler (drag from sidebar)
  // =============================================

  async function handleBoardDrop(type: string, x: number, y: number) {
    if (type === "sticky-note") {
      try {
        const created = await createNote({
          content: "",
          positionX: x,
          positionY: y,
        });
        setNotes((prev) => [...prev, created]);
        setEditingNoteId(created.id);
        setEditingCardId(null);
      } catch {
        // Silently fail
      }
    } else if (type === "index-card") {
      const tempId = `temp-card-${nextTempCardId++}`;
      const now = new Date().toISOString();

      const optimisticCard: IndexCardSummaryDto = {
        id: tempId,
        title: null,
        content: "",
        folderId: null,
        projectId: null,
        tags: [],
        createdAt: now,
        updatedAt: now,
        positionX: x,
        positionY: y,
        width: null,
        height: null,
        color: null,
        rotation: null,
      };

      setIndexCards((prev) => [...prev, optimisticCard]);
      setEditingCardId(tempId);
      setEditingNoteId(null);

      try {
        const created = await createIndexCard({
          content: "",
          positionX: x,
          positionY: y,
        });
        setIndexCards((prev) =>
          prev.map((c) => (c.id === tempId ? created : c)),
        );
        setEditingCardId(created.id);
      } catch {
        // Card stays in local state with temp ID
      }
    }
  }

  // =============================================
  // Red-string linking handlers
  // =============================================

  function handlePinMouseDown(noteId: string) {
    setLinkingFrom(noteId);
    setLinkMousePos(null);
  }

  function handleDeleteConnection(id: string) {
    setConnections((prev) => prev.filter((c) => c.id !== id));
  }

  // Document-level mousemove / mouseup while linking
  useEffect(() => {
    if (!linkingFrom) return;

    function onMouseMove(e: MouseEvent) {
      if (!boardRef.current) return;
      const rect = boardRef.current.getBoundingClientRect();
      setLinkMousePos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }

    function onMouseUp(e: MouseEvent) {
      const sourceId = linkingFromRef.current;
      if (!sourceId) {
        setLinkingFrom(null);
        setLinkMousePos(null);
        return;
      }

      const target = document.elementFromPoint(e.clientX, e.clientY);
      const pinEl = target?.closest("[data-pin-note-id]") as HTMLElement | null;
      const targetNoteId = pinEl?.getAttribute("data-pin-note-id");

      if (targetNoteId && targetNoteId !== sourceId) {
        setConnections((prev) => {
          const isDuplicate = prev.some(
            (c) =>
              (c.fromNoteId === sourceId && c.toNoteId === targetNoteId) ||
              (c.fromNoteId === targetNoteId && c.toNoteId === sourceId),
          );
          if (isDuplicate) return prev;
          const newConn: NoteConnection = {
            id: `conn-${nextConnectionId++}`,
            fromNoteId: sourceId,
            toNoteId: targetNoteId,
          };
          return [...prev, newConn];
        });
      }

      setLinkingFrom(null);
      setLinkMousePos(null);
    }

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);

    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
  }, [linkingFrom]);

  // =============================================
  // Render
  // =============================================

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <span className="text-sm text-foreground/60">Loading your board...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="mb-2 text-sm text-red-500">{error}</p>
          <button
            type="button"
            onClick={fetchData}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const isEmpty = notes.length === 0 && indexCards.length === 0;

  return (
    <div className="relative h-full">
      <CorkBoard boardRef={boardRef} onDropItem={handleBoardDrop}>
        <RedStringLayer
          connections={connections}
          linkingFrom={linkingFrom}
          mousePos={linkMousePos}
          boardRef={boardRef}
          onDeleteConnection={handleDeleteConnection}
        />

        {notes.map((note) => (
          <StickyNote
            key={note.id}
            note={note}
            isEditing={note.id === editingNoteId}
            zIndex={zIndexMap[note.id] ?? 0}
            onDragStop={handleDragStop}
            onDelete={handleDelete}
            onStartEdit={handleStartEdit}
            onSave={handleSave}
            onResize={handleResize}
            onColorChange={handleColorChange}
            onRotationChange={handleRotationChange}
            onPinMouseDown={handlePinMouseDown}
            onBringToFront={bringToFront}
            isLinking={linkingFrom !== null}
          />
        ))}

        {indexCards.map((card) => (
          <IndexCard
            key={card.id}
            card={card}
            isEditing={card.id === editingCardId}
            zIndex={zIndexMap[card.id] ?? 0}
            onDragStop={handleCardDragStop}
            onDelete={handleCardDelete}
            onStartEdit={handleCardStartEdit}
            onSave={handleCardSave}
            onResize={handleCardResize}
            onColorChange={handleCardColorChange}
            onRotationChange={handleCardRotationChange}
            onPinMouseDown={handlePinMouseDown}
            onBringToFront={bringToFront}
            isLinking={linkingFrom !== null}
          />
        ))}

        {isEmpty && (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <p className="mb-2 text-lg font-medium text-gray-700/70">Your board is empty</p>
              <p className="text-sm text-gray-600/60">
                Click the + button to add a sticky note or index card
              </p>
            </div>
          </div>
        )}
      </CorkBoard>

      {/* Floating Add Button with popover menu */}
      <div ref={addMenuRef} className="absolute bottom-6 right-6 z-20">
        {/* Popover menu */}
        <div
          className={[
            "absolute bottom-16 right-0 mb-2 overflow-hidden rounded-xl bg-white shadow-xl border border-gray-200 transition-all duration-200 origin-bottom-right dark:bg-gray-800 dark:border-gray-700",
            showAddMenu
              ? "scale-100 opacity-100 pointer-events-auto"
              : "scale-90 opacity-0 pointer-events-none",
          ].join(" ")}
        >
          <div className="py-1">
            <button
              type="button"
              onClick={handleQuickAddNote}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              <StickyNoteIcon className="h-4 w-4 text-yellow-500" />
              <span>Sticky Note</span>
            </button>
            <button
              type="button"
              onClick={handleQuickAddCard}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              <CreditCard className="h-4 w-4 text-sky-500" />
              <span>Index Card</span>
            </button>
          </div>
        </div>

        {/* Main button */}
        <button
          type="button"
          onClick={() => setShowAddMenu((prev) => !prev)}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 hover:bg-primary/90 focus:outline-none focus:ring-4 focus:ring-primary/20"
          aria-label="Add new item"
        >
          {showAddMenu ? (
            <ChevronUp className="h-6 w-6" />
          ) : (
            <Plus className="h-6 w-6" />
          )}
        </button>
      </div>
    </div>
  );
}
