import { useCallback, useState } from "react";
import type { Editor } from "@tiptap/react";
import { useEditorState } from "@tiptap/react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Type,
  Palette,
  Check,
  RotateCw,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link as LinkIcon,
} from "lucide-react";

interface NoteToolbarProps {
  editor: Editor | null;
  noteColor: string;
  onNoteColorChange: (color: string) => void;
  noteRotation: number;
  onNoteRotationChange: (rotation: number) => void;
}

const ROTATION_PRESETS = [-10, -5, -3, 0, 3, 5, 10];

const FONT_FAMILIES = [
  { label: "Sans", value: "Inter, ui-sans-serif, system-ui, sans-serif" },
  { label: "Serif", value: "Georgia, Cambria, 'Times New Roman', serif" },
  { label: "Mono", value: "ui-monospace, SFMono-Regular, Menlo, monospace" },
  { label: "Cursive", value: "'Segoe Script', 'Comic Sans MS', cursive" },
];

const MIN_FONT_SIZE = 8;
const MAX_FONT_SIZE = 48;
const FONT_SIZE_PRESETS = [8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48];

const TEXT_COLORS = [
  { label: "Black", value: "#1f2937" },
  { label: "Red", value: "#dc2626" },
  { label: "Blue", value: "#2563eb" },
  { label: "Green", value: "#16a34a" },
  { label: "Orange", value: "#ea580c" },
  { label: "Purple", value: "#9333ea" },
];

const NOTE_COLOR_SWATCHES = [
  { key: "yellow", swatch: "bg-yellow-300" },
  { key: "pink", swatch: "bg-pink-300" },
  { key: "blue", swatch: "bg-blue-300" },
  { key: "green", swatch: "bg-green-300" },
  { key: "orange", swatch: "bg-orange-300" },
  { key: "purple", swatch: "bg-purple-300" },
];

function ToolbarButton({
  isActive,
  onClick,
  title,
  children,
}: {
  isActive?: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      title={title}
      className={[
        "flex h-6 w-6 items-center justify-center rounded transition-colors",
        isActive
          ? "bg-sky-100 text-sky-800 ring-1 ring-sky-300/50 dark:bg-sky-900/40 dark:text-sky-200 dark:ring-sky-500/30"
          : "text-gray-600 hover:bg-black/10 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-gray-200",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function parseFontSize(raw: string | undefined | null): number {
  if (!raw) return 14;
  const n = parseInt(raw, 10);
  return Number.isNaN(n) ? 14 : n;
}

function LinkButton({ editor, isLinkActive }: { editor: Editor; isLinkActive: boolean }) {
  const [showInput, setShowInput] = useState(false);
  const [url, setUrl] = useState("");
  const isLink = isLinkActive;

  function handleSetLink() {
    if (url.trim()) {
      editor.chain().focus().setLink({ href: url.trim() }).run();
    } else {
      editor.chain().focus().unsetLink().run();
    }
    setUrl("");
    setShowInput(false);
  }

  return (
    <div className="relative">
      <ToolbarButton
        isActive={isLink}
        onClick={() => {
          if (isLink) {
            editor.chain().focus().unsetLink().run();
          } else {
            setUrl(editor.getAttributes("link").href || "https://");
            setShowInput(true);
          }
        }}
        title="Link / Unlink"
      >
        <LinkIcon className="h-3.5 w-3.5" />
      </ToolbarButton>
      {showInput && (
        <div
          className="absolute left-0 top-full z-50 mt-1 flex gap-1 rounded border border-black/15 bg-white p-1 shadow-lg"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSetLink();
              if (e.key === "Escape") {
                setShowInput(false);
                setUrl("");
              }
            }}
            placeholder="Enter URL"
            autoFocus
            className="h-6 w-44 rounded border border-black/15 px-2 text-[10px] text-gray-700 focus:outline-none"
          />
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              handleSetLink();
            }}
            className="h-6 rounded bg-black/10 px-2 text-[10px] text-gray-700 hover:bg-black/20"
          >
            Set
          </button>
        </div>
      )}
    </div>
  );
}

function FontSizeInput({ editor }: { editor: Editor }) {
  const currentRaw = editor.getAttributes("textStyle").fontSize as
    | string
    | undefined;
  const currentNum = parseFontSize(currentRaw);
  const [isCustom, setIsCustom] = useState(false);
  const [customValue, setCustomValue] = useState(String(currentNum));

  function applySize(val: string) {
    let num = parseInt(val, 10);
    if (Number.isNaN(num)) num = 14;
    num = Math.min(MAX_FONT_SIZE, Math.max(MIN_FONT_SIZE, num));
    setCustomValue(String(num));
    editor.chain().focus().setFontSize(`${num}px`).run();
  }

  if (isCustom) {
    return (
      <input
        autoFocus
        type="number"
        min={MIN_FONT_SIZE}
        max={MAX_FONT_SIZE}
        value={customValue}
        onChange={(e) => setCustomValue(e.target.value)}
        onBlur={(e) => {
          applySize(e.target.value);
          setIsCustom(false);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            applySize((e.target as HTMLInputElement).value);
            setIsCustom(false);
            e.preventDefault();
          }
          if (e.key === "Escape") {
            setIsCustom(false);
          }
        }}
        onMouseDown={(e) => e.stopPropagation()}
        title="Font size (px)"
        className="h-6 w-14 rounded border border-black/15 bg-white/60 px-1 text-center text-[10px] text-gray-700 focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
    );
  }

  // Determine select value: match a preset or show "custom"
  const selectValue = FONT_SIZE_PRESETS.includes(currentNum)
    ? String(currentNum)
    : "custom";

  return (
    <select
      value={selectValue}
      onChange={(e) => {
        if (e.target.value === "custom") {
          setCustomValue(String(currentNum));
          setIsCustom(true);
        } else {
          applySize(e.target.value);
        }
      }}
      onMouseDown={(e) => e.stopPropagation()}
      title="Font Size"
      className="h-6 rounded border border-black/15 bg-white/60 px-1 text-[10px] text-gray-700 focus:outline-none"
    >
      {FONT_SIZE_PRESETS.map((s) => (
        <option key={s} value={String(s)}>
          {s}px
        </option>
      ))}
      {!FONT_SIZE_PRESETS.includes(currentNum) && (
        <option value="custom">{currentNum}px</option>
      )}
      <option value="custom">Custom...</option>
    </select>
  );
}

export function NoteToolbar({
  editor,
  noteColor,
  onNoteColorChange,
  noteRotation,
  onNoteRotationChange,
}: NoteToolbarProps) {
  const setFontFamily = useCallback(
    (value: string) => {
      editor?.chain().focus().setFontFamily(value).run();
    },
    [editor],
  );

  const activeState = useEditorState({
    editor,
    selector: (ctx) => {
      const ed = ctx.editor;
      if (!ed) return null;
      return {
        isBold: ed.isActive("bold"),
        isItalic: ed.isActive("italic"),
        isUnderline: ed.isActive("underline"),
        isStrike: ed.isActive("strike"),
        isLink: ed.isActive("link"),
        textAlignLeft: ed.isActive({ textAlign: "left" }),
        textAlignCenter: ed.isActive({ textAlign: "center" }),
        textAlignRight: ed.isActive({ textAlign: "right" }),
        color: ed.getAttributes("textStyle").color as string | undefined,
      };
    },
  });

  if (!editor) return null;

  const state = activeState ?? {
    isBold: false, isItalic: false, isUnderline: false, isStrike: false, isLink: false,
    textAlignLeft: false, textAlignCenter: false, textAlignRight: false, color: undefined,
  };
  const currentColor = state.color ?? "#1f2937";

  return (
    <div className="space-y-1.5 border-b border-black/10 px-2 pb-2 pt-1">
      {/* Row 1: Text formatting */}
      <div className="flex flex-wrap items-center gap-1">
        {/* Font family */}
        <select
          value={
            editor.getAttributes("textStyle").fontFamily ??
            FONT_FAMILIES[0].value
          }
          onChange={(e) => setFontFamily(e.target.value)}
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

        {/* Font size input */}
        <FontSizeInput editor={editor} />

        <div className="mx-0.5 h-4 w-px bg-black/10" />

        {/* Bold / Italic / Underline / Strikethrough */}
        <ToolbarButton
          isActive={state.isBold}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Bold"
        >
          <Bold className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          isActive={state.isItalic}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Italic"
        >
          <Italic className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          isActive={state.isUnderline}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          title="Underline"
        >
          <Underline className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          isActive={state.isStrike}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          title="Strikethrough"
        >
          <Strikethrough className="h-3.5 w-3.5" />
        </ToolbarButton>

        <div className="mx-0.5 h-4 w-px bg-black/10" />

        {/* Text alignment */}
        <ToolbarButton
          isActive={state.textAlignLeft}
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          title="Align Left"
        >
          <AlignLeft className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          isActive={state.textAlignCenter}
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          title="Align Center"
        >
          <AlignCenter className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          isActive={state.textAlignRight}
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          title="Align Right"
        >
          <AlignRight className="h-3.5 w-3.5" />
        </ToolbarButton>

        <div className="mx-0.5 h-4 w-px bg-black/10" />

        {/* Link / Unlink */}
        <LinkButton editor={editor} isLinkActive={state.isLink} />

        <div className="mx-0.5 h-4 w-px bg-black/10" />

        {/* Text color swatches */}
        <div className="flex items-center gap-0.5">
          <Type className="mr-0.5 h-3 w-3 text-gray-500" />
          {TEXT_COLORS.map((c) => (
            <button
              key={c.value}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                editor.chain().focus().setColor(c.value).run();
              }}
              title={c.label}
              className={[
                "h-4 w-4 rounded-full border transition-transform",
                currentColor === c.value
                  ? "scale-110 border-gray-800 ring-1 ring-gray-400"
                  : "border-black/20 hover:scale-110",
              ].join(" ")}
              style={{ backgroundColor: c.value }}
            />
          ))}
        </div>
      </div>

      {/* Row 2: Note color */}
      <div className="flex items-center gap-1">
        <Palette className="mr-0.5 h-3 w-3 text-gray-500" />
        <span className="text-[10px] text-gray-500">Note:</span>
        {NOTE_COLOR_SWATCHES.map((c) => (
          <button
            key={c.key}
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onNoteColorChange(c.key);
            }}
            title={c.key}
            className={[
              "relative flex h-5 w-5 items-center justify-center rounded-full border transition-transform",
              c.swatch,
              noteColor === c.key
                ? "scale-110 border-gray-800 ring-1 ring-gray-400"
                : "border-black/20 hover:scale-110",
            ].join(" ")}
          >
            {noteColor === c.key && (
              <Check className="h-3 w-3 text-gray-800" strokeWidth={3} />
            )}
          </button>
        ))}
      </div>

      {/* Row 3: Rotation presets */}
      <div className="flex items-center gap-1">
        <RotateCw className="mr-0.5 h-3 w-3 text-gray-500" />
        <span className="text-[10px] text-gray-500">Tilt:</span>
        {ROTATION_PRESETS.map((deg) => (
          <button
            key={deg}
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onNoteRotationChange(deg);
            }}
            title={`${deg}°`}
            className={[
              "flex h-5 min-w-[28px] items-center justify-center rounded border px-1 text-[10px] font-medium transition-colors",
              noteRotation === deg
                ? "border-gray-800 bg-black/15 text-gray-900"
                : "border-black/10 bg-white/50 text-gray-600 hover:bg-black/10",
            ].join(" ")}
          >
            {deg === 0 ? "0°" : `${deg > 0 ? "+" : ""}${deg}°`}
          </button>
        ))}
      </div>
    </div>
  );
}
