import type {
  BoardExportPayload,
  BoardConnectionDto,
  BoardImageSummaryDto,
  IndexCardSummaryDto,
  NoteSummaryDto,
} from "../types";

export function triggerBoardDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function safeBoardFileName(name: string): string {
  return name.replace(/[^\w\s.-]/g, "").trim() || "board";
}

export function buildBoardExportFilename(boardName: string): string {
  const base = safeBoardFileName(boardName);
  const date = new Date().toISOString().slice(0, 10);
  return `${base}-board-${date}.asidenote-board.json`;
}

export function createBoardExportPayload(
  boardType: "NoteBoard" | "ChalkBoard",
  boardName: string,
  options: {
    notes?: NoteSummaryDto[];
    indexCards?: IndexCardSummaryDto[];
    imageCards?: BoardImageSummaryDto[];
    connections?: BoardConnectionDto[];
    drawing?: { canvasJson: string };
    viewport?: { zoom: number; panX: number; panY: number };
  }
): BoardExportPayload {
  const payload: BoardExportPayload = {
    version: 1,
    boardType,
    boardName,
    exportedAt: new Date().toISOString(),
  };
  if (options.notes?.length) payload.notes = options.notes;
  if (options.indexCards?.length) payload.indexCards = options.indexCards;
  if (options.imageCards?.length) payload.imageCards = options.imageCards;
  if (options.connections?.length) payload.connections = options.connections;
  if (options.drawing?.canvasJson) payload.drawing = options.drawing;
  if (options.viewport) payload.viewport = options.viewport;
  return payload;
}

export function parseBoardExportFile(text: string): BoardExportPayload | null {
  try {
    const parsed = JSON.parse(text) as unknown;
    if (
      parsed &&
      typeof parsed === "object" &&
      "version" in parsed &&
      (parsed as BoardExportPayload).version === 1 &&
      "boardType" in parsed &&
      ((parsed as BoardExportPayload).boardType === "NoteBoard" ||
        (parsed as BoardExportPayload).boardType === "ChalkBoard")
    ) {
      return parsed as BoardExportPayload;
    }
  } catch {
    // Invalid JSON or structure
  }
  return null;
}
