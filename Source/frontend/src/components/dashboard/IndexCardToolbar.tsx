import { useCallback, useState } from "react";
import type { Editor } from "@tiptap/react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Type,
  Palette,
  Check,
  RotateCw,
  Table,
  ListChecks,
  List,
  ListOrdered,
  Minus,
  Plus,
  Trash2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Highlighter,
  Link as LinkIcon,
  Subscript as SubscriptIcon,
  Superscript as SuperscriptIcon,
  Eraser,
  Quote,
  Code,
  Code2,
} from "lucide-react";

interface IndexCardToolbarProps {
  editor: Editor | null;
  cardColor: string;
  onCardColorChange: (color: string) => void;
  cardRotation: number;
  onCardRotationChange: (rotation: number) => void;
  /** When true, hide the card color row (e.g. for notebook) */
  hideCardColor?: boolean;
  /** When true, hide the tilt row (e.g. for notebook) */
  hideTilt?: boolean;
}

const ROTATION_PRESETS = [-10, -5, -3, 0, 3, 5, 10];

const FONT_FAMILIES = [
  { label: "Sans", value: "Inter, ui-sans-serif, system-ui, sans-serif" },
  { label: "Serif", value: "Georgia, Cambria, 'Times New Roman', serif" },
  { label: "Mono", value: "ui-monospace, SFMono-Regular, Menlo, monospace" },
  { label: "Cursive", value: "'Segoe Script', 'Comic Sans MS', cursive" },
  { label: "Arial", value: "Arial, sans-serif" },
  { label: "Helvetica", value: "Helvetica, Arial, sans-serif" },
  { label: "Times", value: "Times, 'Times New Roman', serif" },
  { label: "Courier", value: "Courier, 'Courier New', monospace" },
  { label: "Verdana", value: "Verdana, sans-serif" },
  { label: "Trebuchet", value: "'Trebuchet MS', sans-serif" },
  { label: "Palatino", value: "Palatino, 'Palatino Linotype', serif" },
  { label: "Garamond", value: "Garamond, serif" },
  { label: "Bookman", value: "'Bookman Old Style', serif" },
  { label: "Comic Sans", value: "'Comic Sans MS', cursive" },
  { label: "Impact", value: "Impact, sans-serif" },
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

const CARD_COLOR_SWATCHES = [
  { key: "white", swatch: "bg-white border-gray-300" },
  { key: "ivory", swatch: "bg-amber-100" },
  { key: "sky", swatch: "bg-sky-100" },
  { key: "rose", swatch: "bg-rose-100" },
  { key: "mint", swatch: "bg-emerald-100" },
  { key: "lavender", swatch: "bg-violet-100" },
];

function ToolbarButton({
  isActive,
  onClick,
  title,
  children,
  disabled,
}: {
  isActive?: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      title={title}
      className={[
        "flex h-6 w-6 items-center justify-center rounded transition-colors",
        disabled
          ? "cursor-not-allowed text-gray-300"
          : isActive
            ? "bg-black/20 text-gray-900"
            : "text-gray-600 hover:bg-black/10 hover:text-gray-800",
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

const HIGHLIGHT_COLORS = [
  { label: "Yellow", value: "#fef08a" },
  { label: "Green", value: "#86efac" },
  { label: "Blue", value: "#93c5fd" },
  { label: "Pink", value: "#f9a8d4" },
  { label: "Orange", value: "#fdba74" },
  { label: "Purple", value: "#c4b5fd" },
];

function ColorPickerButton({
  editor,
  currentColor,
  type,
}: {
  editor: Editor;
  currentColor: string;
  type: "text" | "highlight";
}) {
  const [showPicker, setShowPicker] = useState(false);
  const [customColor, setCustomColor] = useState(currentColor);

  function handleColorChange(color: string) {
    if (type === "text") {
      editor.chain().focus().setColor(color).run();
    } else {
      editor.chain().focus().toggleHighlight({ color }).run();
    }
    setCustomColor(color);
    setShowPicker(false);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          setShowPicker(!showPicker);
        }}
        title="More colors"
        className="h-4 w-4 rounded border border-black/20 bg-gradient-to-br from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 hover:scale-110 transition-transform"
      />
      {showPicker && (
        <div className="absolute left-0 top-full z-50 mt-1 rounded border border-black/15 bg-white p-2 shadow-lg">
          <input
            type="color"
            value={customColor}
            onChange={(e) => setCustomColor(e.target.value)}
            onMouseDown={(e) => e.stopPropagation()}
            className="h-8 w-full cursor-pointer"
          />
          <div className="mt-1 flex gap-1">
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                handleColorChange(customColor);
              }}
              className="h-6 flex-1 rounded bg-black/10 px-2 text-[10px] text-gray-700 hover:bg-black/20"
            >
              Apply
            </button>
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                setShowPicker(false);
              }}
              className="h-6 flex-1 rounded bg-black/10 px-2 text-[10px] text-gray-700 hover:bg-black/20"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function HighlightButton({ editor }: { editor: Editor }) {
  const [showColors, setShowColors] = useState(false);
  const highlightColor = editor.getAttributes("highlight").color || "#fef08a";

  return (
    <div className="relative">
      <ToolbarButton
        isActive={editor.isActive("highlight")}
        onClick={() => {
          if (editor.isActive("highlight")) {
            editor.chain().focus().unsetHighlight().run();
          } else {
            editor.chain().focus().toggleHighlight({ color: highlightColor }).run();
          }
        }}
        title="Highlight"
      >
        <Highlighter className="h-3.5 w-3.5" />
      </ToolbarButton>
      {showColors && (
        <div className="absolute left-0 top-full z-50 mt-1 flex gap-0.5 rounded border border-black/15 bg-white p-1 shadow-lg">
          {HIGHLIGHT_COLORS.map((c) => (
            <button
              key={c.value}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                editor.chain().focus().toggleHighlight({ color: c.value }).run();
                setShowColors(false);
              }}
              title={c.label}
              className={[
                "h-5 w-5 rounded border transition-transform",
                highlightColor === c.value
                  ? "scale-110 border-gray-800 ring-1 ring-gray-400"
                  : "border-black/20 hover:scale-110",
              ].join(" ")}
              style={{ backgroundColor: c.value }}
            />
          ))}
          <ColorPickerButton editor={editor} currentColor={highlightColor} type="highlight" />
        </div>
      )}
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          setShowColors(!showColors);
        }}
        className="ml-0.5 h-6 w-3 rounded border border-black/15 bg-white/60 text-[8px] text-gray-600 hover:bg-black/10"
        title="Highlight color"
      >
        ▼
      </button>
    </div>
  );
}

function LinkButton({ editor }: { editor: Editor }) {
  const [showInput, setShowInput] = useState(false);
  const [url, setUrl] = useState("");
  const isLink = editor.isActive("link");

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
            const previousUrl = editor.getAttributes("link").href || "";
            setUrl(previousUrl);
            setShowInput(true);
          }
        }}
        title="Link"
      >
        <LinkIcon className="h-3.5 w-3.5" />
      </ToolbarButton>
      {showInput && (
        <div className="absolute left-0 top-full z-50 mt-1 flex gap-1 rounded border border-black/15 bg-white p-1 shadow-lg">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSetLink();
              }
              if (e.key === "Escape") {
                setShowInput(false);
                setUrl("");
              }
            }}
            placeholder="Enter URL"
            autoFocus
            onMouseDown={(e) => e.stopPropagation()}
            className="h-6 w-48 rounded border border-black/15 px-2 text-[10px] text-gray-700 focus:outline-none"
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

function TableOptionsButton({ editor }: { editor: Editor }) {
  const [showDialog, setShowDialog] = useState(false);
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);
  const [withHeaderRow, setWithHeaderRow] = useState(true);

  function handleInsertTable() {
    editor.chain().focus().insertTable({ rows, cols, withHeaderRow }).run();
    setShowDialog(false);
  }

  return (
    <div className="relative">
      <ToolbarButton
        onClick={() => setShowDialog(true)}
        title="Insert Table"
      >
        <Table className="h-3.5 w-3.5" />
      </ToolbarButton>
      {showDialog && (
        <div className="absolute left-0 top-full z-50 mt-1 rounded border border-black/15 bg-white p-2 shadow-lg">
          <div className="mb-2 text-[10px] font-medium text-gray-700">Table Options</div>
          <div className="mb-2 flex items-center gap-2">
            <label className="text-[10px] text-gray-600">Rows:</label>
            <input
              type="number"
              min="1"
              max="20"
              value={rows}
              onChange={(e) => setRows(Math.max(1, Math.min(20, parseInt(e.target.value, 10) || 1)))}
              onMouseDown={(e) => e.stopPropagation()}
              className="h-6 w-16 rounded border border-black/15 px-1 text-center text-[10px] text-gray-700 focus:outline-none"
            />
          </div>
          <div className="mb-2 flex items-center gap-2">
            <label className="text-[10px] text-gray-600">Cols:</label>
            <input
              type="number"
              min="1"
              max="20"
              value={cols}
              onChange={(e) => setCols(Math.max(1, Math.min(20, parseInt(e.target.value, 10) || 1)))}
              onMouseDown={(e) => e.stopPropagation()}
              className="h-6 w-16 rounded border border-black/15 px-1 text-center text-[10px] text-gray-700 focus:outline-none"
            />
          </div>
          <div className="mb-2 flex items-center gap-2">
            <input
              type="checkbox"
              checked={withHeaderRow}
              onChange={(e) => setWithHeaderRow(e.target.checked)}
              onMouseDown={(e) => e.stopPropagation()}
              className="h-3 w-3"
            />
            <label className="text-[10px] text-gray-600">Header row</label>
          </div>
          <div className="flex gap-1">
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                handleInsertTable();
              }}
              className="h-6 flex-1 rounded bg-black/10 px-2 text-[10px] text-gray-700 hover:bg-black/20"
            >
              Insert
            </button>
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                setShowDialog(false);
              }}
              className="h-6 flex-1 rounded bg-black/10 px-2 text-[10px] text-gray-700 hover:bg-black/20"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function IndexCardToolbar({
  editor,
  cardColor,
  onCardColorChange,
  cardRotation,
  onCardRotationChange,
  hideCardColor = false,
  hideTilt = false,
}: IndexCardToolbarProps) {
  const setFontFamily = useCallback(
    (value: string) => {
      editor?.chain().focus().setFontFamily(value).run();
    },
    [editor],
  );

  if (!editor) return null;

  const currentColor = editor.getAttributes("textStyle").color ?? "#1f2937";
  const isInsideTable =
    editor.isActive("table") ||
    editor.isActive("tableRow") ||
    editor.isActive("tableCell") ||
    editor.isActive("tableHeader");

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
          isActive={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Bold"
        >
          <Bold className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          isActive={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Italic"
        >
          <Italic className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          isActive={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          title="Underline"
        >
          <Underline className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          isActive={editor.isActive("strike")}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          title="Strikethrough"
        >
          <Strikethrough className="h-3.5 w-3.5" />
        </ToolbarButton>

        <div className="mx-0.5 h-4 w-px bg-black/10" />

        {/* Heading dropdown */}
        <select
          value={
            editor.isActive("heading", { level: 1 })
              ? "1"
              : editor.isActive("heading", { level: 2 })
                ? "2"
                : editor.isActive("heading", { level: 3 })
                  ? "3"
                  : editor.isActive("heading", { level: 4 })
                    ? "4"
                    : editor.isActive("heading", { level: 5 })
                      ? "5"
                      : editor.isActive("heading", { level: 6 })
                        ? "6"
                        : "0"
          }
          onChange={(e) => {
            const level = parseInt(e.target.value, 10);
            if (level === 0) {
              editor.chain().focus().setParagraph().run();
            } else {
              editor.chain().focus().toggleHeading({ level: level as 1 | 2 | 3 | 4 | 5 | 6 }).run();
            }
          }}
          onMouseDown={(e) => e.stopPropagation()}
          className="h-6 rounded border border-black/15 bg-white/60 px-1 text-[10px] text-gray-700 focus:outline-none"
          title="Heading"
        >
          <option value="0">Normal</option>
          <option value="1">Heading 1</option>
          <option value="2">Heading 2</option>
          <option value="3">Heading 3</option>
          <option value="4">Heading 4</option>
          <option value="5">Heading 5</option>
          <option value="6">Heading 6</option>
        </select>

        <div className="mx-0.5 h-4 w-px bg-black/10" />

        {/* Text alignment */}
        <ToolbarButton
          isActive={editor.isActive({ textAlign: "left" })}
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          title="Align Left"
        >
          <AlignLeft className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          isActive={editor.isActive({ textAlign: "center" })}
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          title="Align Center"
        >
          <AlignCenter className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          isActive={editor.isActive({ textAlign: "right" })}
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          title="Align Right"
        >
          <AlignRight className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          isActive={editor.isActive({ textAlign: "justify" })}
          onClick={() => editor.chain().focus().setTextAlign("justify").run()}
          title="Justify"
        >
          <AlignJustify className="h-3.5 w-3.5" />
        </ToolbarButton>

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
          <ColorPickerButton editor={editor} currentColor={currentColor} type="text" />
        </div>

        <div className="mx-0.5 h-4 w-px bg-black/10" />

        {/* Highlight */}
        <HighlightButton editor={editor} />

        {/* Link */}
        <LinkButton editor={editor} />

        {/* Subscript / Superscript */}
        <ToolbarButton
          isActive={editor.isActive("subscript")}
          onClick={() => editor.chain().focus().toggleSubscript().run()}
          title="Subscript"
        >
          <SubscriptIcon className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          isActive={editor.isActive("superscript")}
          onClick={() => editor.chain().focus().toggleSuperscript().run()}
          title="Superscript"
        >
          <SuperscriptIcon className="h-3.5 w-3.5" />
        </ToolbarButton>

        <div className="mx-0.5 h-4 w-px bg-black/10" />

        {/* Blockquote */}
        <ToolbarButton
          isActive={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          title="Blockquote"
        >
          <Quote className="h-3.5 w-3.5" />
        </ToolbarButton>

        {/* Code */}
        <ToolbarButton
          isActive={editor.isActive("code")}
          onClick={() => editor.chain().focus().toggleCode().run()}
          title="Inline Code"
        >
          <Code className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          isActive={editor.isActive("codeBlock")}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          title="Code Block"
        >
          <Code2 className="h-3.5 w-3.5" />
        </ToolbarButton>

        {/* Clear formatting */}
        <ToolbarButton
          onClick={() => {
            editor.chain().focus().clearNodes().unsetAllMarks().run();
          }}
          title="Clear Formatting"
        >
          <Eraser className="h-3.5 w-3.5" />
        </ToolbarButton>
      </div>

      {/* Row 2: Card color (optional) */}
      {!hideCardColor && (
        <div className="flex items-center gap-1">
          <Palette className="mr-0.5 h-3 w-3 text-gray-500" />
          <span className="text-[10px] text-gray-500">Card:</span>
          {CARD_COLOR_SWATCHES.map((c) => (
            <button
              key={c.key}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onCardColorChange(c.key);
              }}
              title={c.key}
              className={[
                "relative flex h-5 w-5 items-center justify-center rounded-full border transition-transform",
                c.swatch,
                cardColor === c.key
                  ? "scale-110 border-gray-800 ring-1 ring-gray-400"
                  : "border-black/20 hover:scale-110",
              ].join(" ")}
            >
              {cardColor === c.key && (
                <Check className="h-3 w-3 text-gray-800" strokeWidth={3} />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Row 3: Rotation presets (optional) */}
      {!hideTilt && (
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
                onCardRotationChange(deg);
              }}
              title={`${deg}°`}
              className={[
                "flex h-5 min-w-[28px] items-center justify-center rounded border px-1 text-[10px] font-medium transition-colors",
                cardRotation === deg
                  ? "border-gray-800 bg-black/15 text-gray-900"
                  : "border-black/10 bg-white/50 text-gray-600 hover:bg-black/10",
              ].join(" ")}
            >
              {deg === 0 ? "0°" : `${deg > 0 ? "+" : ""}${deg}°`}
            </button>
          ))}
        </div>
      )}

      {/* Row 4: Content blocks — Table, Task List, Bullet List, Ordered List, Horizontal Rule */}
      <div className="flex flex-wrap items-center gap-1">
        <span className="text-[10px] text-gray-500 mr-0.5">Insert:</span>

        <TableOptionsButton editor={editor} />

        <ToolbarButton
          isActive={editor.isActive("taskList")}
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          title="Toggle Task List"
        >
          <ListChecks className="h-3.5 w-3.5" />
        </ToolbarButton>

        <ToolbarButton
          isActive={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Toggle Bullet List"
        >
          <List className="h-3.5 w-3.5" />
        </ToolbarButton>

        <ToolbarButton
          isActive={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Toggle Ordered List"
        >
          <ListOrdered className="h-3.5 w-3.5" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Insert Horizontal Rule"
        >
          <Minus className="h-3.5 w-3.5" />
        </ToolbarButton>

        {/* Table-specific controls (visible when cursor is inside a table) */}
        {isInsideTable && (
          <>
            <div className="mx-0.5 h-4 w-px bg-black/10" />
            <span className="text-[10px] text-gray-500 mr-0.5">Table:</span>

            <ToolbarButton
              onClick={() => editor.chain().focus().addRowAfter().run()}
              title="Add Row"
            >
              <span className="flex items-center gap-px text-[9px] font-bold">
                <Plus className="h-2.5 w-2.5" />R
              </span>
            </ToolbarButton>

            <ToolbarButton
              onClick={() => editor.chain().focus().deleteRow().run()}
              title="Delete Row"
            >
              <span className="flex items-center gap-px text-[9px] font-bold">
                <Trash2 className="h-2.5 w-2.5" />R
              </span>
            </ToolbarButton>

            <ToolbarButton
              onClick={() => editor.chain().focus().addColumnAfter().run()}
              title="Add Column"
            >
              <span className="flex items-center gap-px text-[9px] font-bold">
                <Plus className="h-2.5 w-2.5" />C
              </span>
            </ToolbarButton>

            <ToolbarButton
              onClick={() => editor.chain().focus().deleteColumn().run()}
              title="Delete Column"
            >
              <span className="flex items-center gap-px text-[9px] font-bold">
                <Trash2 className="h-2.5 w-2.5" />C
              </span>
            </ToolbarButton>

            <ToolbarButton
              onClick={() => editor.chain().focus().deleteTable().run()}
              title="Delete Table"
            >
              <span className="flex items-center gap-px text-[9px] font-bold text-red-500">
                <Trash2 className="h-2.5 w-2.5" />
              </span>
            </ToolbarButton>
          </>
        )}
      </div>
    </div>
  );
}
