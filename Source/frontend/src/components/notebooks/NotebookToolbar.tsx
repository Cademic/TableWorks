import { useEffect, useState } from "react";
import { Type } from "lucide-react";

const FONT_FAMILIES = [
  { label: "Sans", value: "Inter, ui-sans-serif, system-ui, sans-serif" },
  { label: "Serif", value: "Georgia, Cambria, 'Times New Roman', serif" },
  { label: "Mono", value: "ui-monospace, SFMono-Regular, Menlo, monospace" },
  { label: "Cursive", value: "'Segoe Script', 'Comic Sans MS', cursive" },
];

const FONT_SIZE_PRESETS = [10, 12, 14, 16, 18, 20, 24];

interface NotebookToolbarProps {
  fontFamily: string;
  onFontFamilyChange: (value: string) => void;
  fontSize: number;
  onFontSizeChange: (value: number) => void;
}

export function NotebookToolbar({
  fontFamily,
  onFontFamilyChange,
  fontSize,
  onFontSizeChange,
}: NotebookToolbarProps) {
  const [customFontSize, setCustomFontSize] = useState(String(fontSize));
  useEffect(() => {
    setCustomFontSize(String(fontSize));
  }, [fontSize]);

  return (
    <div className="space-y-1.5 border-b border-black/10 px-2 pb-2 pt-1">
      <div className="flex flex-wrap items-center gap-1">
        <select
          value={fontFamily}
          onChange={(e) => onFontFamilyChange(e.target.value)}
          onMouseDown={(e) => e.stopPropagation()}
          className="h-6 rounded border border-black/15 bg-white/60 px-1 text-[10px] text-gray-700 focus:outline-none"
          title="Font Family"
        >
          {FONT_FAMILIES.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>

        <select
          value={String(fontSize)}
          onChange={(e) => {
            const v = e.target.value;
            if (v) {
              const n = parseInt(v, 10);
              onFontSizeChange(n);
              setCustomFontSize(v);
            }
          }}
          onMouseDown={(e) => e.stopPropagation()}
          className="h-6 rounded border border-black/15 bg-white/60 px-1 text-[10px] text-gray-700 focus:outline-none"
          title="Font Size"
        >
          {FONT_SIZE_PRESETS.map((s) => (
            <option key={s} value={String(s)}>
              {s}px
            </option>
          ))}
          {!FONT_SIZE_PRESETS.includes(fontSize) && (
            <option value={String(fontSize)}>{fontSize}px</option>
          )}
        </select>

        <div className="mx-0.5 flex items-center gap-0.5">
          <Type className="h-3 w-3 text-gray-500" />
          <input
            type="number"
            min={8}
            max={48}
            value={customFontSize}
            onChange={(e) => setCustomFontSize(e.target.value)}
            onBlur={() => {
              const n = parseInt(customFontSize, 10);
              if (!Number.isNaN(n)) {
                const clamped = Math.min(48, Math.max(8, n));
                onFontSizeChange(clamped);
                setCustomFontSize(String(clamped));
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const n = parseInt(customFontSize, 10);
                if (!Number.isNaN(n)) {
                  const clamped = Math.min(48, Math.max(8, n));
                  onFontSizeChange(clamped);
                  setCustomFontSize(String(clamped));
                }
              }
            }}
            onMouseDown={(e) => e.stopPropagation()}
            title="Font size (px)"
            className="h-6 w-12 rounded border border-black/15 bg-white/60 px-1 text-center text-[10px] text-gray-700 focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
        </div>
      </div>
    </div>
  );
}
