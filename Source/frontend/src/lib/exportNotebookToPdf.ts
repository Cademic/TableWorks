/**
 * Client-side PDF export for notebook content using html2pdf.js.
 * Renders the given HTML (editor body) with print-friendly styles and triggers download.
 */

const PROSE_STYLES = `
  body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; max-width: 816px; margin: 0 auto; padding: 40px; color: #18181b; background: #fff; box-sizing: border-box; }
  * { box-sizing: border-box; }
  .prose { max-width: none; }
  p { margin: 0 0 0.75em; page-break-inside: avoid; }
  ul, ol { margin: 0.5em 0; padding-left: 1.5em; }
  li { page-break-inside: avoid; }
  h1, h2, h3, h4, h5, h6 { margin: 1em 0 0.5em; font-weight: 600; page-break-inside: avoid; page-break-after: avoid; }
  blockquote { margin: 0.5em 0; padding-left: 1em; border-left: 4px solid #d4d4d8; color: #52525b; page-break-inside: avoid; }
  code { background: #f4f4f5; padding: 0.2em 0.4em; border-radius: 4px; font-size: 0.9em; }
  pre { background: #f4f4f5; padding: 1em; overflow-x: auto; border-radius: 6px; page-break-inside: avoid; }
  a { color: #2563eb; text-decoration: underline; }
  table { border-collapse: collapse; width: 100%; page-break-inside: avoid; }
  th, td { border: 1px solid #e4e4e7; padding: 0.5em 0.75em; text-align: left; }
  th { background: #f4f4f5; font-weight: 600; }
  img { max-width: 100%; height: auto; }
  hr { margin: 1.25em 0; padding: 0; border: none; border-top: 2px solid #18181b; display: block; }
`;

/** Elements we ask html2pdf not to split across pages (reduces mid-block cut-off). */
const PAGEBREAK_AVOID = ["p", "li", "h1", "h2", "h3", "h4", "h5", "h6", "blockquote", "pre", "tr", "table"];

/**
 * Export notebook body HTML to a PDF file and trigger download.
 * @param bodyHtml - HTML string from the editor (e.g. editor.getHTML())
 * @param filename - Download filename without extension (e.g. "My Notebook")
 */
export async function exportNotebookToPdf(bodyHtml: string, filename: string): Promise<void> {
  const html2pdf = (await import("html2pdf.js")).default;
  const fullHtml = `<div style="background:#fff;padding:40px;color:#18181b;"><style>${PROSE_STYLES}</style><div class="prose">${bodyHtml}</div></div>`;

  const options = {
    margin: 10,
    filename: `${filename}.pdf`,
    image: { type: "jpeg" as const, quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      logging: false,
      allowTaint: true,
    },
    jsPDF: { unit: "mm" as const, format: "a4" as const, orientation: "portrait" as const },
    pagebreak: { mode: ["css", "legacy"] as const, avoid: PAGEBREAK_AVOID },
  };
  await html2pdf().set(options).from(fullHtml).save();
}
