import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import type { NoteConnection } from "../../types";

interface PinPosition {
  x: number;
  y: number;
}

interface RedStringLayerProps {
  connections: NoteConnection[];
  linkingFrom: string | null;
  mousePos: { x: number; y: number } | null;
  boardRef: React.RefObject<HTMLDivElement | null>;
  onDeleteConnection: (id: string) => void;
}

/** Droop amount (px) for the catenary curve control point */
const DROOP_PX = 40;
const STRING_COLOR = "#dc2626";

/** Build a quadratic bezier path string with a catenary-style droop. */
function buildCatenaryPath(from: PinPosition, to: PinPosition): string {
  const midX = (from.x + to.x) / 2;
  const midY = (from.y + to.y) / 2;
  const dist = Math.abs(to.x - from.x);
  const droop = DROOP_PX * Math.min(1, dist / 300);
  return `M ${from.x} ${from.y} Q ${midX} ${midY + droop} ${to.x} ${to.y}`;
}

/**
 * Read the centre position of every pin on the board, relative to the board
 * container. Returns a Map keyed by note ID.
 */
function readPinPositions(boardEl: HTMLDivElement): Map<string, PinPosition> {
  const map = new Map<string, PinPosition>();
  const boardRect = boardEl.getBoundingClientRect();
  const pins = boardEl.querySelectorAll<HTMLElement>("[data-pin-note-id]");
  pins.forEach((pin) => {
    const noteId = pin.getAttribute("data-pin-note-id");
    if (!noteId) return;
    const r = pin.getBoundingClientRect();
    map.set(noteId, {
      x: r.left + r.width / 2 - boardRect.left,
      y: r.top + r.height / 2 - boardRect.top,
    });
  });
  return map;
}

export function RedStringLayer({
  connections,
  linkingFrom,
  mousePos,
  boardRef,
  onDeleteConnection,
}: RedStringLayerProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredConnection, setHoveredConnection] = useState<string | null>(null);

  // Store latest props in refs so the rAF loop can read them without deps.
  const connectionsRef = useRef(connections);
  const linkingFromRef = useRef(linkingFrom);
  const mousePosRef = useRef(mousePos);
  connectionsRef.current = connections;
  linkingFromRef.current = linkingFrom;
  mousePosRef.current = mousePos;

  // Persistent rAF loop that reads pin positions from the DOM every frame and
  // writes directly to SVG path `d` attributes. This avoids React re-renders
  // entirely for position tracking, making the strings perfectly fluid.
  useEffect(() => {
    let rafId: number;

    function tick() {
      const svg = svgRef.current;
      const board = boardRef.current;
      if (!svg || !board) {
        rafId = requestAnimationFrame(tick);
        return;
      }

      const pins = readPinPositions(board);
      const conns = connectionsRef.current;
      const linking = linkingFromRef.current;
      const mouse = mousePosRef.current;

      // Update established connection paths
      for (const conn of conns) {
        const from = pins.get(conn.fromNoteId);
        const to = pins.get(conn.toNoteId);
        // Each connection has two paths: hit-area and visible (data-conn-id)
        const visible = svg.querySelector<SVGPathElement>(
          `[data-conn-visible="${conn.id}"]`,
        );
        const hitArea = svg.querySelector<SVGPathElement>(
          `[data-conn-hit="${conn.id}"]`,
        );
        if (from && to) {
          const d = buildCatenaryPath(from, to);
          if (visible) visible.setAttribute("d", d);
          if (hitArea) hitArea.setAttribute("d", d);
        }
      }

      // Update in-progress linking line
      const linkPath = svg.querySelector<SVGPathElement>("[data-link-line]");
      if (linkPath && linking && mouse) {
        const from = pins.get(linking);
        if (from) {
          linkPath.setAttribute("d", buildCatenaryPath(from, mouse));
          linkPath.setAttribute("visibility", "visible");
        } else {
          linkPath.setAttribute("visibility", "hidden");
        }
      } else if (linkPath) {
        linkPath.setAttribute("visibility", "hidden");
      }

      rafId = requestAnimationFrame(tick);
    }

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [boardRef]);

  // Nothing to render
  if (connections.length === 0 && !linkingFrom) return null;

  // For the hover delete button, compute positions from pinPositions once on
  // hover (not every frame) so the button is positioned correctly.
  const hoveredConn = hoveredConnection
    ? connections.find((c) => c.id === hoveredConnection)
    : null;

  let deleteButtonPos: { x: number; y: number; droop: number } | null = null;
  if (hoveredConn && boardRef.current) {
    const pins = readPinPositions(boardRef.current);
    const from = pins.get(hoveredConn.fromNoteId);
    const to = pins.get(hoveredConn.toNoteId);
    if (from && to) {
      const dist = Math.abs(to.x - from.x);
      const droop = DROOP_PX * Math.min(1, dist / 300);
      deleteButtonPos = {
        x: (from.x + to.x) / 2,
        y: (from.y + to.y) / 2,
        droop,
      };
    }
  }

  return (
    <svg
      ref={svgRef}
      className="pointer-events-none absolute inset-0 z-[5]"
      style={{ width: "100%", height: "100%" }}
    >
      {/* Established connections */}
      {connections.map((conn) => {
        const isHovered = hoveredConnection === conn.id;
        return (
          <g key={conn.id}>
            {/* Invisible wider hit-area */}
            <path
              data-conn-hit={conn.id}
              d="M 0 0"
              fill="none"
              stroke="transparent"
              strokeWidth={14}
              className="pointer-events-stroke cursor-pointer"
              onMouseEnter={() => setHoveredConnection(conn.id)}
              onMouseLeave={() => setHoveredConnection(null)}
              onClick={() => onDeleteConnection(conn.id)}
            />
            {/* Visible string */}
            <path
              data-conn-visible={conn.id}
              d="M 0 0"
              fill="none"
              stroke={STRING_COLOR}
              strokeWidth={isHovered ? 3 : 2}
              strokeLinecap="round"
              opacity={isHovered ? 1 : 0.85}
            />
            {/* Delete icon on hover */}
            {isHovered && deleteButtonPos && (
              <foreignObject
                x={deleteButtonPos.x - 10}
                y={deleteButtonPos.y + deleteButtonPos.droop - 10}
                width={20}
                height={20}
                className="pointer-events-auto cursor-pointer"
                onClick={() => onDeleteConnection(conn.id)}
              >
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-red-600 shadow-md">
                  <X className="h-3 w-3 text-white" />
                </div>
              </foreignObject>
            )}
          </g>
        );
      })}

      {/* In-progress linking line (always present but hidden via attribute) */}
      <path
        data-link-line=""
        d="M 0 0"
        fill="none"
        stroke={STRING_COLOR}
        strokeWidth={2}
        strokeLinecap="round"
        strokeDasharray="6 4"
        opacity={0.6}
        visibility="hidden"
      />
    </svg>
  );
}
