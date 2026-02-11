import { useCallback, useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { CorkBoard } from "../components/dashboard/CorkBoard";
import { StickyNote } from "../components/dashboard/StickyNote";
import { RedStringLayer } from "../components/dashboard/RedStringLayer";
import { getNotes, createNote, patchNote, deleteNote } from "../api/notes";
import type { NoteSummaryDto, NoteConnection } from "../types";

let nextConnectionId = 1;

export function DashboardPage() {
  const [notes, setNotes] = useState<NoteSummaryDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

  // --- Red-string linking state ---
  const [connections, setConnections] = useState<NoteConnection[]>([]);
  const [linkingFrom, setLinkingFrom] = useState<string | null>(null);
  const [linkMousePos, setLinkMousePos] = useState<{ x: number; y: number } | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const linkingFromRef = useRef<string | null>(null);

  // Keep ref in sync so document listeners can read latest value
  linkingFromRef.current = linkingFrom;

  const fetchNotes = useCallback(async () => {
    try {
      setError(null);
      const response = await getNotes({ limit: 100 });
      setNotes(response.items);
    } catch {
      setError("Failed to load notes.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  async function handleQuickAdd() {
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

    // Optimistically update local state
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
      // Silently fail - local state still updated
    }
  }

  function handleStartEdit(id: string) {
    setEditingNoteId(id);
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
    // Remove any connections involving the deleted note
    setConnections((prev) =>
      prev.filter((c) => c.fromNoteId !== id && c.toNoteId !== id),
    );

    try {
      await deleteNote(id);
    } catch {
      fetchNotes();
    }
  }

  // --- Red-string linking handlers ---

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

      // Check if mouse was released over a pin
      const target = document.elementFromPoint(e.clientX, e.clientY);
      const pinEl = target?.closest("[data-pin-note-id]") as HTMLElement | null;
      const targetNoteId = pinEl?.getAttribute("data-pin-note-id");

      if (targetNoteId && targetNoteId !== sourceId) {
        // Prevent duplicate connections between the same pair of notes
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
            onClick={fetchNotes}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full">
      <CorkBoard boardRef={boardRef}>
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
            onDragStop={handleDragStop}
            onDelete={handleDelete}
            onStartEdit={handleStartEdit}
            onSave={handleSave}
            onResize={handleResize}
            onColorChange={handleColorChange}
            onRotationChange={handleRotationChange}
            onPinMouseDown={handlePinMouseDown}
            isLinking={linkingFrom !== null}
          />
        ))}

        {notes.length === 0 && (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <p className="mb-2 text-lg font-medium text-gray-700/70">Your board is empty</p>
              <p className="text-sm text-gray-600/60">
                Click the + button to add your first sticky note
              </p>
            </div>
          </div>
        )}
      </CorkBoard>

      {/* Floating Add Button */}
      <button
        type="button"
        onClick={handleQuickAdd}
        className="absolute bottom-6 right-6 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 hover:bg-primary/90 focus:outline-none focus:ring-4 focus:ring-primary/20"
        aria-label="Add new note"
      >
        <Plus className="h-6 w-6" />
      </button>
    </div>
  );
}
