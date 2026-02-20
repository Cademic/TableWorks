/**
 * Stable color palette for board presence (connected users, focus borders, cursors).
 * Same userId always maps to the same color across clients.
 */
const PRESENCE_PALETTE = [
  "#e11d48", // rose-600
  "#2563eb", // blue-600
  "#16a34a", // green-600
  "#c026d3", // fuchsia-600 (distinct from pink/purple)
  "#9333ea", // purple-600
  "#0d9488", // teal-600
  "#0891b2", // cyan-600 (replaces orange for better contrast)
  "#be185d", // pink-600
  "#0369a1", // sky-700
  "#4f46e5", // indigo-600
];

function hashUserId(userId: string): number {
  let h = 0;
  const s = userId;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export function getColorForUserId(userId: string): string {
  const index = hashUserId(userId) % PRESENCE_PALETTE.length;
  return PRESENCE_PALETTE[index]!;
}
