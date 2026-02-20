import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useOutletContext } from "react-router-dom";
import { Plus, StickyNote as StickyNoteIcon, CreditCard, ChevronUp, Image as ImageIcon } from "lucide-react";
import type { AppLayoutContext } from "../components/layout/AppLayout";
import { CorkBoard } from "../components/dashboard/CorkBoard";
import { StickyNote } from "../components/dashboard/StickyNote";
import { IndexCard } from "../components/dashboard/IndexCard";
import { ImageCard } from "../components/dashboard/ImageCard";
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
import {
  getBoardById,
  getBoardImageCards,
  createBoardImageCard,
  patchBoardImageCard,
  deleteBoardImageCard,
  uploadBoardImage,
} from "../api/boards";
import type {
  NoteSummaryDto,
  IndexCardSummaryDto,
  BoardConnectionDto,
  BoardSummaryDto,
  BoardImageSummaryDto,
} from "../types";
import { useBoardRealtime, type BoardItemUpdatePayload } from "../hooks/useBoardRealtime";
import { useAuth } from "../context/AuthContext";
import { getColorForUserId } from "../lib/presenceColors";

let nextTempCardId = 1;

export function NoteBoardPage() {
  const { boardId } = useParams<{ boardId: string }>();
  const { setBoardName, openBoard, setBoardPresence } = useOutletContext<AppLayoutContext>();
  const { isAuthenticated, user } = useAuth();
  const currentUserId = user?.userId ?? null;

  const [board, setBoard] = useState<BoardSummaryDto | null>(null);
  const [notes, setNotes] = useState<NoteSummaryDto[]>([]);
  const [indexCards, setIndexCards] = useState<IndexCardSummaryDto[]>([]);
  const [imageCards, setImageCards] = useState<BoardImageSummaryDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingNoteIds, setEditingNoteIds] = useState<Set<string>>(new Set());
  const [editingCardIds, setEditingCardIds] = useState<Set<string>>(new Set());
  const primaryEditingNoteIdRef = useRef<string | null>(null);
  const primaryEditingCardIdRef = useRef<string | null>(null);
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
  const imageFileInputRef = useRef<HTMLInputElement>(null);
  const [pendingImageDrop, setPendingImageDrop] = useState<{ x: number; y: number } | null>(null);

  // --- Viewport state (pan & zoom) ---
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);

  // --- Board presence: who is focusing which item, remote cursors ---
  const [remoteFocus, setRemoteFocus] = useState<Map<string, { userId: string; color: string }[]>>(new Map());
  const [remoteCursors, setRemoteCursors] = useState<Map<string, { x: number; y: number; color: string }>>(new Map());
  const cursorThrottleRef = useRef<{ last: number }>({ last: 0 });
  const CURSOR_THROTTLE_MS = 60;

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
    // #region agent log
    fetch('http://127.0.0.1:7887/ingest/9b54b090-c8e8-4b5b-b36e-8d4dee1fa1ed',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'d9986e'},body:JSON.stringify({sessionId:'d9986e',location:'NoteBoardPage.tsx:143',message:'fetchData called',data:{boardId,editingNoteIdsBefore:Array.from(editingNoteIds)},timestamp:Date.now(),runId:'run1',hypothesisId:'A,E'})}).catch(()=>{});
    // #endregion
    if (!boardId) return;
    try {
      setError(null);
      const [boardRes, notesRes, cardsRes, connsRes, imagesRes] = await Promise.allSettled([
        getBoardById(boardId),
        getNotes({ boardId, limit: 100 }),
        getIndexCards({ boardId, limit: 100 }),
        getConnections({ boardId }),
        getBoardImageCards(boardId),
      ]);

      if (boardRes.status === "fulfilled") {
        setBoard(boardRes.value);
      }
      if (notesRes.status === "fulfilled") {
        // #region agent log
        const newNoteIds = notesRes.value.items.map(n => n.id);
        const editingIdsBefore = Array.from(editingNoteIds);
        const notesStillExist = editingIdsBefore.filter(id => newNoteIds.includes(id));
        fetch('http://127.0.0.1:7887/ingest/9b54b090-c8e8-4b5b-b36e-8d4dee1fa1ed',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'d9986e'},body:JSON.stringify({sessionId:'d9986e',location:'NoteBoardPage.tsx:161',message:'fetchData setting notes',data:{noteCount:notesRes.value.items.length,editingNoteIds:editingIdsBefore,newNoteIds,notesStillExist,willLoseEditing:editingIdsBefore.filter(id => !newNoteIds.includes(id))},timestamp:Date.now(),runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        setNotes(notesRes.value.items);
        // #region agent log
        setTimeout(() => {
          fetch('http://127.0.0.1:7887/ingest/9b54b090-c8e8-4b5b-b36e-8d4dee1fa1ed',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'d9986e'},body:JSON.stringify({sessionId:'d9986e',location:'NoteBoardPage.tsx:166',message:'AFTER setNotes',data:{editingNoteIds:Array.from(editingNoteIds)},timestamp:Date.now(),runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        }, 0);
        // #endregion
      }
      if (cardsRes.status === "fulfilled") {
        setIndexCards(cardsRes.value.items);
      }
      if (connsRes.status === "fulfilled") {
        setConnections(connsRes.value);
      }
      if (imagesRes.status === "fulfilled") {
        setImageCards(imagesRes.value);
      }

      // Only show error if all failed
      if (
        boardRes.status === "rejected" &&
        notesRes.status === "rejected" &&
        cardsRes.status === "rejected" &&
        imagesRes.status === "rejected"
      ) {
        setError("Failed to load board items.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [boardId]);

  useEffect(() => {
    if (isAuthenticated) fetchData();
  }, [fetchData, isAuthenticated]);

  const draggingNoteIdRef = useRef<string | null>(null);
  const draggingCardIdRef = useRef<string | null>(null);
  const RESIZE_ECHO_IGNORE_MS = 400;
  const lastResizedNoteRef = useRef<{ id: string; at: number } | null>(null);
  const lastResizedCardRef = useRef<{ id: string; at: number } | null>(null);

  const mergeNotePayload = useCallback((payload: BoardItemUpdatePayload) => {
    // #region agent log
    fetch('http://127.0.0.1:7887/ingest/9b54b090-c8e8-4b5b-b36e-8d4dee1fa1ed',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'d9986e'},body:JSON.stringify({sessionId:'d9986e',location:'NoteBoardPage.tsx:195',message:'mergeNotePayload called',data:{noteId:String(payload.id),editingNoteIds:Array.from(editingNoteIds)},timestamp:Date.now(),runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    const id = String(payload.id);
    const skipPosition = id === draggingNoteIdRef.current;
    const skipSize =
      lastResizedNoteRef.current?.id === id &&
      Date.now() - lastResizedNoteRef.current.at < RESIZE_ECHO_IGNORE_MS;
    setNotes((prev) =>
      prev.map((n) => {
        if (n.id !== id) return n;
        const next = { ...n };
        if (!skipPosition && payload.positionX !== undefined) next.positionX = payload.positionX;
        if (!skipPosition && payload.positionY !== undefined) next.positionY = payload.positionY;
        if (payload.title !== undefined) next.title = payload.title;
        if (payload.content !== undefined && payload.content !== null) next.content = payload.content;
        if (!skipSize && payload.width !== undefined) next.width = payload.width;
        if (!skipSize && payload.height !== undefined) next.height = payload.height;
        if (payload.color !== undefined) next.color = payload.color;
        if (payload.rotation !== undefined) next.rotation = payload.rotation;
        return next;
      }),
    );
  }, []);
  const mergeCardPayload = useCallback((payload: BoardItemUpdatePayload) => {
    const id = String(payload.id);
    const skipPosition = id === draggingCardIdRef.current;
    const skipSize =
      lastResizedCardRef.current?.id === id &&
      Date.now() - lastResizedCardRef.current.at < RESIZE_ECHO_IGNORE_MS;
    setIndexCards((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const next = { ...c };
        if (!skipPosition && payload.positionX !== undefined) next.positionX = payload.positionX;
        if (!skipPosition && payload.positionY !== undefined) next.positionY = payload.positionY;
        if (payload.title !== undefined) next.title = payload.title;
        if (payload.content !== undefined && payload.content !== null) next.content = payload.content;
        if (!skipSize && payload.width !== undefined) next.width = payload.width;
        if (!skipSize && payload.height !== undefined) next.height = payload.height;
        if (payload.color !== undefined) next.color = payload.color;
        if (payload.rotation !== undefined) next.rotation = payload.rotation;
        return next;
      }),
    );
  }, []);

  const handleUserFocusingItem = useCallback(
    (userId: string, itemType: string, itemId: string | null) => {
      // #region agent log
      fetch('http://127.0.0.1:7887/ingest/9b54b090-c8e8-4b5b-b36e-8d4dee1fa1ed',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'d9986e'},body:JSON.stringify({sessionId:'d9986e',location:'NoteBoardPage.tsx:240',message:'handleUserFocusingItem called',data:{userId,currentUserId,itemType,itemId,editingNoteIds:Array.from(editingNoteIds),matches:currentUserId!=null&&userId===currentUserId},timestamp:Date.now(),runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      if (currentUserId != null && userId === currentUserId) return;
      setRemoteFocus((prev) => {
        const next = new Map(prev);
        const color = getColorForUserId(userId);
        const entry = { userId, color };
        for (const [key, list] of next) {
          const filtered = list.filter((u) => u.userId !== userId);
          if (filtered.length === 0) next.delete(key);
          else next.set(key, filtered);
        }
        if (itemId) {
          const key = `${itemType}:${itemId}`;
          const existing = next.get(key) ?? [];
          if (!existing.some((u) => u.userId === userId)) next.set(key, [...existing, entry]);
        }
        return next;
      });
    },
    [currentUserId],
  );
  const handleCursorPosition = useCallback((userId: string, x: number, y: number) => {
    if (x < 0 || y < 0) {
      setRemoteCursors((prev) => {
        const next = new Map(prev);
        next.delete(userId);
        return next;
      });
      return;
    }
    setRemoteCursors((prev) => {
      const next = new Map(prev);
      next.set(userId, { x, y, color: getColorForUserId(userId) });
      return next;
    });
  }, []);

  const { sendFocus, sendCursor } = useBoardRealtime(boardId ?? undefined, fetchData, {
    onNoteUpdated: mergeNotePayload,
    onIndexCardUpdated: mergeCardPayload,
    onPresenceUpdate: setBoardPresence,
    onUserFocusingItem: handleUserFocusingItem,
    onCursorPosition: handleCursorPosition,
  });

  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7887/ingest/9b54b090-c8e8-4b5b-b36e-8d4dee1fa1ed',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'d9986e'},body:JSON.stringify({sessionId:'d9986e',location:'NoteBoardPage.tsx:286',message:'focus useEffect running',data:{editingNoteIds:Array.from(editingNoteIds),editingCardIds:Array.from(editingCardIds),primaryNote:primaryEditingNoteIdRef.current,primaryCard:primaryEditingCardIdRef.current},timestamp:Date.now(),runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    const primaryNote = primaryEditingNoteIdRef.current;
    const primaryCard = primaryEditingCardIdRef.current;
    if (primaryNote) sendFocus("note", primaryNote);
    else if (primaryCard) sendFocus("card", primaryCard);
    else sendFocus("note", null);
  }, [editingNoteIds, editingCardIds, sendFocus]);

  const handleBoardMouseMove = useCallback(
    (x: number, y: number) => {
      const now = Date.now();
      if (now - cursorThrottleRef.current.last < CURSOR_THROTTLE_MS) return;
      cursorThrottleRef.current.last = now;
      sendCursor(x, y);
    },
    [sendCursor],
  );
  const handleBoardMouseLeave = useCallback(() => {
    sendCursor(-1, -1);
  }, [sendCursor]);

  const DRAG_THROTTLE_MS = 120;
  type DragPending = { x: number; y: number; timer: ReturnType<typeof setTimeout> };
  const noteDragMapRef = useRef<Map<string, DragPending>>(new Map());
  const cardDragMapRef = useRef<Map<string, DragPending>>(new Map());

  const handleNoteDrag = useCallback((id: string, x: number, y: number) => {
    const map = noteDragMapRef.current;
    let entry = map.get(id);
    if (!entry) {
      entry = {
        x,
        y,
        timer: setTimeout(() => {
          const e = map.get(id);
          if (e) {
            patchNote(id, { positionX: e.x, positionY: e.y }).catch(() => {});
            map.delete(id);
          }
        }, DRAG_THROTTLE_MS),
      };
      map.set(id, entry);
    } else {
      entry.x = x;
      entry.y = y;
    }
  }, []);
  const handleCardDrag = useCallback((id: string, x: number, y: number) => {
    const map = cardDragMapRef.current;
    let entry = map.get(id);
    if (!entry) {
      entry = {
        x,
        y,
        timer: setTimeout(() => {
          const e = map.get(id);
          if (e) {
            patchIndexCard(id, { positionX: e.x, positionY: e.y }).catch(() => {});
            map.delete(id);
          }
        }, DRAG_THROTTLE_MS),
      };
      map.set(id, entry);
    } else {
      entry.x = x;
      entry.y = y;
    }
  }, []);

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
      } else if (type === "image-card") {
        setPendingImageDrop(null);
        imageFileInputRef.current?.click();
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
      setEditingNoteIds((prev) => new Set(prev).add(created.id));
      primaryEditingNoteIdRef.current = created.id;
      setEditingCardIds(new Set());
      primaryEditingCardIdRef.current = null;
    } catch {
      // Silently fail - user can retry
    }
  }

  const DRAG_ECHO_IGNORE_MS = 280;
  function handleNoteDragStart(id: string) {
    draggingNoteIdRef.current = id;
  }
  async function handleDragStop(id: string, x: number, y: number) {
    const pending = noteDragMapRef.current.get(id);
    if (pending) {
      clearTimeout(pending.timer);
      noteDragMapRef.current.delete(id);
    }
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, positionX: x, positionY: y } : n)),
    );
    // Keep treating this id as "just dragged" so we ignore echo broadcasts (our own PATCH or late throttle)
    window.setTimeout(() => {
      if (draggingNoteIdRef.current === id) draggingNoteIdRef.current = null;
    }, DRAG_ECHO_IGNORE_MS);

    try {
      await patchNote(id, { positionX: x, positionY: y });
    } catch {
      // Silently fail
    }
  }

  async function handleSave(id: string, title: string, content: string) {
    // #region agent log
    fetch('http://127.0.0.1:7887/ingest/9b54b090-c8e8-4b5b-b36e-8d4dee1fa1ed',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'d9986e'},body:JSON.stringify({sessionId:'d9986e',location:'NoteBoardPage.tsx:460',message:'handleSave called',data:{noteId:id,editingNoteIdsBefore:Array.from(editingNoteIds)},timestamp:Date.now(),runId:'run1',hypothesisId:'A,B,C,D,E'})}).catch(()=>{});
    // #endregion
    setEditingNoteIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      // #region agent log
      if (prev.has(id)) {
        fetch('http://127.0.0.1:7887/ingest/9b54b090-c8e8-4b5b-b36e-8d4dee1fa1ed',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'d9986e'},body:JSON.stringify({sessionId:'d9986e',location:'NoteBoardPage.tsx:465',message:'REMOVING note from editingNoteIds (save)',data:{noteId:id,before:Array.from(prev),after:Array.from(next)},timestamp:Date.now(),runId:'run1',hypothesisId:'A,B,C,D,E'})}).catch(()=>{});
      }
      // #endregion
      if (primaryEditingNoteIdRef.current === id) {
        primaryEditingNoteIdRef.current = next.size ? next.values().next().value ?? null : null;
      }
      return next;
    });

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

  async function handleNoteContentChange(id: string, title: string, content: string) {
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
    // #region agent log
    fetch('http://127.0.0.1:7887/ingest/9b54b090-c8e8-4b5b-b36e-8d4dee1fa1ed',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'d9986e'},body:JSON.stringify({sessionId:'d9986e',location:'NoteBoardPage.tsx:482',message:'handleStartEdit called',data:{noteId:id,editingNoteIdsBefore:Array.from(editingNoteIds)},timestamp:Date.now(),runId:'run1',hypothesisId:'A,B,C,D,E'})}).catch(()=>{});
    // #endregion
    setEditingNoteIds((prev) => new Set(prev).add(id));
    primaryEditingNoteIdRef.current = id;
    bringToFront(id);
  }

  async function handleResize(id: string, width: number, height: number) {
    lastResizedNoteRef.current = { id, at: Date.now() };
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
    // #region agent log
    fetch('http://127.0.0.1:7887/ingest/9b54b090-c8e8-4b5b-b36e-8d4dee1fa1ed',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'d9986e'},body:JSON.stringify({sessionId:'d9986e',location:'NoteBoardPage.tsx:550',message:'handleDelete called',data:{noteId:id,editingNoteIdsBefore:Array.from(editingNoteIds)},timestamp:Date.now(),runId:'run1',hypothesisId:'A,B,C,D,E'})}).catch(()=>{});
    // #endregion
    setNotes((prev) => prev.filter((n) => n.id !== id));
    setEditingNoteIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      // #region agent log
      if (prev.has(id)) {
        fetch('http://127.0.0.1:7887/ingest/9b54b090-c8e8-4b5b-b36e-8d4dee1fa1ed',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'d9986e'},body:JSON.stringify({sessionId:'d9986e',location:'NoteBoardPage.tsx:559',message:'REMOVING note from editingNoteIds (delete)',data:{noteId:id,before:Array.from(prev),after:Array.from(next)},timestamp:Date.now(),runId:'run1',hypothesisId:'A,B,C,D,E'})}).catch(()=>{});
      }
      // #endregion
      if (primaryEditingNoteIdRef.current === id) {
        primaryEditingNoteIdRef.current = next.size ? next.values().next().value ?? null : null;
      }
      return next;
    });
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
    setEditingCardIds((prev) => new Set(prev).add(tempId));
    primaryEditingCardIdRef.current = tempId;
    // #region agent log
    const editingBefore = Array.from(editingNoteIds);
    if (editingBefore.length > 0) {
      fetch('http://127.0.0.1:7887/ingest/9b54b090-c8e8-4b5b-b36e-8d4dee1fa1ed',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'d9986e'},body:JSON.stringify({sessionId:'d9986e',location:'NoteBoardPage.tsx:603',message:'CLEARING ALL editingNoteIds (create card)',data:{editingNoteIdsBefore:editingBefore,tempCardId:tempId},timestamp:Date.now(),runId:'run1',hypothesisId:'A,B,C,D,E'})}).catch(()=>{});
    }
    // #endregion
    setEditingNoteIds(new Set());
    primaryEditingNoteIdRef.current = null;

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
      setEditingCardIds((prev) => {
        const next = new Set(prev);
        next.delete(tempId);
        next.add(created.id);
        return next;
      });
      primaryEditingCardIdRef.current = created.id;
    } catch {
      // Card stays in local state with temp ID
    }
  }

  function handleCardDragStart(id: string) {
    draggingCardIdRef.current = id;
  }
  async function handleCardDragStop(id: string, x: number, y: number) {
    const pending = cardDragMapRef.current.get(id);
    if (pending) {
      clearTimeout(pending.timer);
      cardDragMapRef.current.delete(id);
    }
    setIndexCards((prev) =>
      prev.map((c) => (c.id === id ? { ...c, positionX: x, positionY: y } : c)),
    );
    window.setTimeout(() => {
      if (draggingCardIdRef.current === id) draggingCardIdRef.current = null;
    }, DRAG_ECHO_IGNORE_MS);

    try {
      await patchIndexCard(id, { positionX: x, positionY: y });
    } catch {
      // Silently fail
    }
  }

  async function handleCardSave(id: string, title: string, content: string) {
    setEditingCardIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      if (primaryEditingCardIdRef.current === id) {
        primaryEditingCardIdRef.current = next.size ? next.values().next().value ?? null : null;
      }
      return next;
    });

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

  async function handleCardContentChange(id: string, title: string, content: string) {
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
    setEditingCardIds((prev) => new Set(prev).add(id));
    primaryEditingCardIdRef.current = id;
    bringToFront(id);
  }

  async function handleCardResize(id: string, width: number, height: number) {
    lastResizedCardRef.current = { id, at: Date.now() };
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

  async function handleQuickAddImage() {
    if (!boardId) return;
    setShowAddMenu(false);
    setPendingImageDrop(null);
    imageFileInputRef.current?.click();
  }

  function handleImageFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !boardId) return;

    const positionX = pendingImageDrop ? pendingImageDrop.x : 30 + Math.random() * 400;
    const positionY = pendingImageDrop ? pendingImageDrop.y : 30 + Math.random() * 300;
    setPendingImageDrop(null);

    uploadBoardImage(boardId, file)
      .then(({ url }) =>
        createBoardImageCard(boardId, {
          imageUrl: url,
          positionX,
          positionY,
        })
      )
      .then((created) => {
        setImageCards((prev) => [...prev, created]);
      })
      .catch(() => {
        // Silently fail
      });
  }

  async function handleImageDragStop(id: string, x: number, y: number) {
    setImageCards((prev) =>
      prev.map((img) => (img.id === id ? { ...img, positionX: x, positionY: y } : img))
    );
    if (!boardId) return;
    try {
      await patchBoardImageCard(boardId, id, { positionX: x, positionY: y });
    } catch {
      // Silently fail
    }
  }

  async function handleImageResize(id: string, width: number, height: number) {
    setImageCards((prev) =>
      prev.map((img) => (img.id === id ? { ...img, width, height } : img))
    );
    if (!boardId) return;
    try {
      await patchBoardImageCard(boardId, id, { width, height });
    } catch {
      // Silently fail
    }
  }

  async function handleImageDelete(id: string) {
    setImageCards((prev) => prev.filter((img) => img.id !== id));
    setConnections((prev) => prev.filter((c) => c.fromItemId !== id && c.toItemId !== id));
    if (!boardId) return;
    try {
      await deleteBoardImageCard(boardId, id);
    } catch {
      fetchData();
    }
  }

  async function handleCardDelete(id: string) {
    setIndexCards((prev) => prev.filter((c) => c.id !== id));
    setEditingCardIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      if (primaryEditingCardIdRef.current === id) {
        primaryEditingCardIdRef.current = next.size ? next.values().next().value ?? null : null;
      }
      return next;
    });
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
        setEditingNoteIds((prev) => new Set(prev).add(created.id));
        primaryEditingNoteIdRef.current = created.id;
        setEditingCardIds(new Set());
        primaryEditingCardIdRef.current = null;
      } catch {
        // Silently fail
      }
    } else if (type === "image-card") {
      setPendingImageDrop({ x, y });
      imageFileInputRef.current?.click();
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
      setEditingCardIds((prev) => new Set(prev).add(tempId));
      primaryEditingCardIdRef.current = tempId;
      // #region agent log
      const editingBefore = Array.from(editingNoteIds);
      if (editingBefore.length > 0) {
        fetch('http://127.0.0.1:7887/ingest/9b54b090-c8e8-4b5b-b36e-8d4dee1fa1ed',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'d9986e'},body:JSON.stringify({sessionId:'d9986e',location:'NoteBoardPage.tsx:890',message:'CLEARING ALL editingNoteIds (drop card)',data:{editingNoteIdsBefore:editingBefore,tempCardId:tempId},timestamp:Date.now(),runId:'run1',hypothesisId:'A,B,C,D,E'})}).catch(()=>{});
      }
      // #endregion
      setEditingNoteIds(new Set());
      primaryEditingNoteIdRef.current = null;

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
        setEditingCardIds((prev) => {
          const next = new Set(prev);
          next.delete(tempId);
          next.add(created.id);
          return next;
        });
        primaryEditingCardIdRef.current = created.id;
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

  const isEmpty = notes.length === 0 && indexCards.length === 0 && imageCards.length === 0;

  return (
    <div className="relative h-full">
      {/* Board content */}
      <div className="absolute inset-0">
        <CorkBoard
          boardRef={boardRef}
          onDropItem={handleBoardDrop}
          onBoardMouseMove={handleBoardMouseMove}
          onBoardMouseLeave={handleBoardMouseLeave}
          zoom={zoom}
          panX={panX}
          panY={panY}
          onViewportChange={handleViewportChange}
        >
          {/* Remote cursors layer (board-space coords, same transform as canvas) */}
          <div className="pointer-events-none absolute inset-0" aria-hidden>
            {Array.from(remoteCursors.entries()).map(([userId, { x, y, color }]) => (
              <div
                key={userId}
                className="absolute z-[9999] flex items-center gap-1"
                style={{ left: x, top: y, transform: "translate(8px, 4px)" }}
              >
                <svg width="20" height="24" viewBox="0 0 20 24" fill="none" className="drop-shadow-md">
                  <path
                    d="M2 2l6 6 2.5-2.5L5 2.5 2 2z"
                    fill={color}
                    stroke="rgba(0,0,0,0.3)"
                    strokeWidth="1"
                  />
                </svg>
              </div>
            ))}
          </div>

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
              isEditing={editingNoteIds.has(note.id)}
              focusedBy={remoteFocus.get(`note:${note.id}`) ?? null}
              zIndex={zIndexMap[note.id] ?? 0}
              onDrag={handleNoteDrag}
              onDragStart={handleNoteDragStart}
              onDragStop={handleDragStop}
              onDelete={handleDelete}
              onStartEdit={handleStartEdit}
              onSave={handleSave}
              onContentChange={handleNoteContentChange}
              onResize={handleResize}
              onColorChange={handleColorChange}
              onRotationChange={handleRotationChange}
              onPinMouseDown={handlePinMouseDown}
              onBringToFront={bringToFront}
              isLinking={linkingFrom !== null}
              zoom={zoom}
            />
          ))}

          {imageCards.map((img) => (
            <ImageCard
              key={img.id}
              image={img}
              zIndex={zIndexMap[img.id] ?? 0}
              onDragStop={handleImageDragStop}
              onDelete={handleImageDelete}
              onResize={handleImageResize}
              onBringToFront={bringToFront}
              onPinMouseDown={handlePinMouseDown}
              isLinking={linkingFrom !== null}
              zoom={zoom}
            />
          ))}

          {indexCards.map((card) => (
            <IndexCard
              key={card.id}
              card={card}
              isEditing={editingCardIds.has(card.id)}
              focusedBy={remoteFocus.get(`card:${card.id}`) ?? null}
              zIndex={zIndexMap[card.id] ?? 0}
              onDrag={handleCardDrag}
              onDragStart={handleCardDragStart}
              onDragStop={handleCardDragStop}
              onDelete={handleCardDelete}
              onStartEdit={handleCardStartEdit}
              onSave={handleCardSave}
              onContentChange={handleCardContentChange}
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
                  Click the + button to add a sticky note, image, or index card
                </p>
              </div>
            </div>
          )}

          <input
            ref={imageFileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={handleImageFileSelect}
          />
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
              onClick={handleQuickAddImage}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              <ImageIcon className="h-4 w-4 text-emerald-500" />
              <span>Image</span>
            </button>
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
