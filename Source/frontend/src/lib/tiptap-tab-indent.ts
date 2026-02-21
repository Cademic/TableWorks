import type { EditorView } from "@tiptap/pm/view";

/**
 * Handle Tab key to insert indent (tab character).
 * Returns true to consume the event (prevent default), false to let other handlers (e.g. list indent) run.
 */
export function handleTabKey(view: EditorView, event: KeyboardEvent): boolean {
  if (event.key !== "Tab") return false;
  // When inside a list, let the default list-keymap handle Tab (sink/lift list item)
  const { $from } = view.state.selection;
  for (let d = $from.depth; d > 0; d--) {
    const node = $from.node(d);
    if (node.type.name === "listItem" || node.type.name === "taskItem") {
      return false;
    }
  }
  event.preventDefault();
  view.dispatch(view.state.tr.insertText("\t"));
  return true;
}
