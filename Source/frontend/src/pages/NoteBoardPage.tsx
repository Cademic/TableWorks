import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useOutletContext } from "react-router-dom";
import { Plus, StickyNote as StickyNoteIcon, CreditCard, ChevronUp } from "lucide-react";
import type { AppLayoutContext } from "../components/layout/AppLayout";
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
import {
  getConnections,
  createConnection,
  deleteConnection,
} from "../api/connections";
import { getBoardById } from "../api/boards";
import type { NoteSummaryDto, IndexCardSummaryDto, BoardConnectionDto, BoardSummaryDto } from "../types";

let nextTempCardId = 1;

export function NoteBoardPage() {
  const { boardId } = useParams<{ boardId: string }>();
  const { setBoardName, openBoard } = useOutletContext<AppLayoutContext>();

  const [board, setBoard] = useState<BoardSummaryDto | null>(null);
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
  const [connections, setConnections] = useState<BoardConnectionDto[]>([]);
  const [linkingFrom, setLinkingFrom] = useState<string | null>(null);
  const [linkMousePos, setLinkMousePos] = useState<{ x: number; y: number } | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const linkingFromRef = useRef<string | null>(null);
  const connectionsRef = useRef(connections);
  const addMenuRef = useRef<HTMLDivElement>(null);

  // --- Viewport state (pan & zoom) ---
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);

  // Restore viewport from localStorage on mount
  useEffect(() => {
    if (!boardId) return;
    try {
      const saved = localStorage.getItem(`board-viewport-${boardId}`);
      if (saved) {
        const { zoom: z, panX: px, panY: py } = JSON.parse(saved);
        if (typeof z === "number") setZoom(z);
        if (typeof px === "number") setPanX(px);
        if (typeof py === "number") setPanY(py);
      }
    } catch {
      // ignore parse errors
    }
  }, [boardId]);

  // Persist viewport to localStorage (debounced)
  const viewportTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!boardId) return;
    if (viewportTimerRef.current) clearTimeout(viewportTimerRef.current);
    viewportTimerRef.current = setTimeout(() => {
      localStorage.setItem(`board-viewport-${boardId}`, JSON.stringify({ zoom, panX, panY }));
    }, 300);
    return () => {
      if (viewportTimerRef.current) clearTimeout(viewportTimerRef.current);
    };
  }, [boardId, zoom, panX, panY]);

  function handleViewportChange(newZoom: number, newPanX: number, newPanY: number) {
    setZoom(newZoom);
    setPanX(newPanX);
    setPanY(newPanY);
  }

  // Keep refs in sync so document listeners can read latest value
  linkingFromRef.current = linkingFrom;
  connectionsRef.current = connections;

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
    if (!boardId) return;
    try {
      setError(null);
      const [boardRes, notesRes, cardsRes, connsRes] = await Promise.allSettled([
        getBoardById(boardId),
        getNotes({ boardId, limit: 100 }),
        getIndexCards({ boardId, limit: 100 }),
        getConnections({ boardId }),
      ]);

      if (boardRes.status === "fulfilled") {
        setBoard(boardRes.value);
      }
      if (notesRes.status === "fulfilled") {
        setNotes(notesRes.value.items);
      }
      if (cardsRes.status === "fulfilled") {
        setIndexCards(cardsRes.value.items);
      }
      if (connsRes.status === "fulfilled") {
        setConnections(connsRes.value);
      }

      // Only show error if all failed
      if (boardRes.status === "rejected" && notesRes.status === "rejected" && cardsRes.status === "rejected" && connsRes.status === "rejected") {
        setError("Failed to load board items.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [boardId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Push the board name up to the navbar
  useEffect(() => {
    setBoardName(board?.name ?? null);
    return () => setBoardName(null);
  }, [board?.name, setBoardName]);

  // Register this board in the "Opened Boards" sidebar section
  useEffect(() => {
    if (board) {
      openBoard({ id: board.id, name: board.name, boardType: board.boardType });
    }
  }, [board, openBoard]);

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
    if (!boardId) return;
    setShowAddMenu(false);
    try {
      const positionX = 30 + Math.random() * 400;
      const positionY = 30 + Math.random() * 300;

      const created = await createNote({
        content: "",
        boardId,
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
      prev.filter((c) => c.fromItemId !== id && c.toItemId !== id),
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
    if (!boardId) return;
    setShowAddMenu(false);
    const positionX = 30 + Math.random() * 300;
    const positionY = 30 + Math.random() * 200;
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
        boardId,
        positionX,
        positionY,
      });

      setIndexCards((prev) =>
        prev.map((c) => (c.id === tempId ? created : c)),
      );
      setEditingCardId(created.id);
    } catch {
      // Card stays in local state with temp ID
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
      prev.filter((c) => c.fromItemId !== id && c.toItemId !== id),
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
    if (!boardId) return;

    if (type === "sticky-note") {
      try {
        const created = await createNote({
          content: "",
          boardId,
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
          boardId,
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

  async function handleDeleteConnection(id: string) {
    setConnections((prev) => prev.filter((c) => c.id !== id));
    try {
      await deleteConnection(id);
    } catch {
      // Silently fail
    }
  }

  // Document-level mousemove / mouseup while linking
  useEffect(() => {
    if (!linkingFrom) return;

    function onMouseMove(e: MouseEvent) {
      if (!boardRef.current) return;
      const rect = boardRef.current.getBoundingClientRect();
      setLinkMousePos({
        x: (e.clientX - rect.left) / zoom,
        y: (e.clientY - rect.top) / zoom,
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
        const isDuplicate = connectionsRef.current.some(
          (c) =>
            (c.fromItemId === sourceId && c.toItemId === targetNoteId) ||
            (c.fromItemId === targetNoteId && c.toItemId === sourceId),
        );
        if (!isDuplicate) {
          createConnection({ fromItemId: sourceId, toItemId: targetNoteId, boardId: boardId ?? undefined })
            .then((created) => {
              setConnections((prev) => [...prev, created]);
            })
            .catch(() => {
              // Silently fail
            });
        }
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
  }, [linkingFrom, boardId, zoom]);

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
      {/* Board content */}
      <div className="absolute inset-0">
        <CorkBoard
          boardRef={boardRef}
          onDropItem={handleBoardDrop}
          zoom={zoom}
          panX={panX}
          panY={panY}
          onViewportChange={handleViewportChange}
        >
          <RedStringLayer
            connections={connections}
            linkingFrom={linkingFrom}
            mousePos={linkMousePos}
            boardRef={boardRef}
            onDeleteConnection={handleDeleteConnection}
            zoom={zoom}
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
              zoom={zoom}
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
              zoom={zoom}
            />
          ))}

          {isEmpty && (
            <div className="flex h-full items-center justify-center" style={{ pointerEvents: "none" }}>
              <div className="text-center">
                <p className="mb-2 text-lg font-medium text-gray-700/70">Your board is empty</p>
                <p className="text-sm text-gray-600/60">
                  Click the + button to add a sticky note or index card
                </p>
              </div>
            </div>
          )}
        </CorkBoard>
      </div>

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
