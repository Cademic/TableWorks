import type { NoteSummaryDto, IndexCardSummaryDto } from "../types";

const NOTE_COLOR_KEYS = ["yellow", "pink", "blue", "green", "orange", "purple"] as const;
const CARD_COLOR_KEYS = ["white", "ivory", "sky", "rose", "mint", "lavender"] as const;

/** Returns the color key used for display (explicit or id-hash derived). Use when restoring items to preserve display color. */
export function resolveNoteColorKey(note: NoteSummaryDto): string {
  if (note?.color && NOTE_COLOR_KEYS.includes(note.color as (typeof NOTE_COLOR_KEYS)[number])) return note.color;
  let hash = 0;
  const id = note?.id ?? "";
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return NOTE_COLOR_KEYS[Math.abs(hash) % NOTE_COLOR_KEYS.length];
}

/** Returns the color key used for display (explicit or id-hash derived). Use when restoring items to preserve display color. */
export function resolveCardColorKey(card: IndexCardSummaryDto): string {
  if (card?.color && CARD_COLOR_KEYS.includes(card.color as (typeof CARD_COLOR_KEYS)[number])) return card.color;
  let hash = 0;
  const id = card?.id ?? "";
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return CARD_COLOR_KEYS[Math.abs(hash) % CARD_COLOR_KEYS.length];
}
