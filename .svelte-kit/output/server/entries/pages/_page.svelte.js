import { a8 as ssr_context, k as attr_class, p as clsx, a9 as store_get, z as ensure_array_like, ae as unsubscribe_stores, l as attr_style, A as escape_html, aa as stringify, j as attr, w as derived, M as head } from "../../chunks/renderer.js";
import "clsx";
import { w as writable, g as get } from "../../chunks/index.js";
import { invoke } from "@tauri-apps/api/core";
import { EditorView } from "codemirror";
import { Compartment } from "@codemirror/state";
import { keymap } from "@codemirror/view";
import MarkdownIt from "markdown-it";
function html(value) {
  var html2 = String(value);
  var open = "<!---->";
  return open + html2 + "<!---->";
}
function onDestroy(fn) {
  /** @type {SSRContext} */
  ssr_context.r.on_destroy(fn);
}
const notes = writable([]);
const currentNote = writable(null);
const noteListChanged = writable(0);
const deletingNotePaths = writable(/* @__PURE__ */ new Set());
const errorMessage = writable([]);
let errorIdCounter = 0;
const errorTimeouts = /* @__PURE__ */ new Map();
function showError(message) {
  const id = ++errorIdCounter;
  errorMessage.update((errors) => [...errors, { id, message }]);
  const timeout = setTimeout(() => {
    dismissError(id);
  }, 4e3);
  errorTimeouts.set(id, timeout);
}
function dismissError(id) {
  const timeout = errorTimeouts.get(id);
  if (timeout) {
    clearTimeout(timeout);
    errorTimeouts.delete(id);
  }
  errorMessage.update((errors) => errors.filter((e) => e.id !== id));
}
async function deleteNote(path) {
  if (get(deletingNotePaths).has(path)) return;
  const previousNotes = get(notes);
  const previousCurrent = get(currentNote);
  deletingNotePaths.update((paths) => new Set(paths).add(path));
  notes.update((list) => list.filter((n) => n.path !== path));
  currentNote.update((n) => n && n.path === path ? null : n);
  try {
    await invoke("delete_note", { path });
  } catch (e) {
    notes.set(previousNotes);
    currentNote.set(previousCurrent);
    showError(`Failed to delete note: ${e}`);
  } finally {
    deletingNotePaths.update((paths) => {
      const next = new Set(paths);
      next.delete(path);
      return next;
    });
    noteListChanged.update((n) => n + 1);
  }
}
const selectedFolder = writable(null);
function FolderTree($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    let tree = [];
    let expandedPaths = /* @__PURE__ */ new Set();
    function folderBtnClass(path, isActive) {
      const base = "flex w-full items-center gap-1.5 rounded-md px-3 py-1.5 text-left text-xs transition-colors";
      if (isActive) {
        return `${base} bg-quiet-active text-quiet-text font-medium`;
      }
      return `${base} text-quiet-muted hover:bg-quiet-hover hover:text-quiet-text`;
    }
    function treeNode($$renderer3, node, depth = 0) {
      $$renderer3.push(`<div><button${attr_class(clsx(folderBtnClass(node.path, store_get($$store_subs ??= {}, "$selectedFolder", selectedFolder) === node.path)))}${attr_style(`padding-left: ${stringify(12 + depth * 12)}px`)}>`);
      if (node.children.length > 0) {
        $$renderer3.push("<!--[0-->");
        $$renderer3.push(`<span${attr_class(`inline-flex h-3.5 w-3.5 shrink-0 cursor-pointer items-center justify-center transition-transform ${expandedPaths.has(node.path) ? "rotate-90" : ""}`)} role="button" tabindex="0"><svg viewBox="0 0 16 16" fill="currentColor" class="h-3 w-3"><path d="M6 4l4 4-4 4"></path></svg></span>`);
      } else {
        $$renderer3.push("<!--[-1-->");
        $$renderer3.push(`<span class="inline-flex w-3.5 shrink-0"></span>`);
      }
      $$renderer3.push(`<!--]--> <svg class="h-3.5 w-3.5 shrink-0" viewBox="0 0 16 16" fill="currentColor"><path d="M.5 3.5a2 2 0 0 1 2-2h3.672a2 2 0 0 1 1.414.586l.828.828A2 2 0 0 0 9.828 3h3.672a2 2 0 0 1 2 2v6.5a2 2 0 0 1-2 2h-11a2 2 0 0 1-2-2v-7.5Z"></path></svg> <span class="truncate">${escape_html(node.name)}</span></button> `);
      if (expandedPaths.has(node.path) && node.children.length > 0) {
        $$renderer3.push("<!--[0-->");
        $$renderer3.push(`<!--[-->`);
        const each_array = ensure_array_like(node.children);
        for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
          let child = each_array[$$index];
          treeNode($$renderer3, child, depth + 1);
        }
        $$renderer3.push(`<!--]-->`);
      } else {
        $$renderer3.push("<!--[-1-->");
      }
      $$renderer3.push(`<!--]--></div>`);
    }
    if (tree.length === 0) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="px-3 py-2 text-xs text-quiet-faded">No folders</div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<div class="space-y-px"><button${attr_class(clsx(folderBtnClass(null, store_get($$store_subs ??= {}, "$selectedFolder", selectedFolder) === null)))}><svg class="h-3.5 w-3.5 shrink-0" viewBox="0 0 16 16" fill="currentColor"><path d="M1 2.5A1.5 1.5 0 0 1 2.5 1h2.879a1.5 1.5 0 0 1 1.06.44l1.122 1.12H13.5A1.5 1.5 0 0 1 15 4v9.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 1 13.5V2.5Z"></path></svg> All Notes</button> <!--[-->`);
      const each_array_1 = ensure_array_like(tree);
      for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
        let node = each_array_1[$$index_1];
        treeNode($$renderer2, node);
      }
      $$renderer2.push(`<!--]--></div>`);
    }
    $$renderer2.push(`<!--]-->`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
  });
}
const sidebarCollapsed = writable(false);
const searchResultCount = writable(0);
const searchResults = writable([]);
const showNewNoteInput = writable(false);
function ConfirmModal($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      open = false,
      title = "Confirm",
      message = "",
      confirmLabel = "Delete",
      onconfirm,
      oncancel
    } = $$props;
    if (open) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="fixed inset-0 z-50 flex items-center justify-center"><div class="absolute inset-0 bg-black/30" role="presentation"></div> <div class="relative mx-4 flex w-[320px] max-w-full flex-col rounded-xl border border-quiet-border bg-[var(--q-bg)] shadow-xl" role="dialog" aria-modal="true"${attr("aria-label", title)} tabindex="0"><div class="px-5 py-4"><h3 class="text-sm font-semibold text-quiet-text">${escape_html(title)}</h3> <p class="mt-1.5 text-xs text-quiet-muted">${escape_html(message)}</p></div> <div class="flex items-center justify-end gap-2 border-t border-quiet-border/60 px-5 py-3"><button class="rounded-md px-3.5 py-1.5 text-xs font-medium text-quiet-faded transition-colors hover:bg-quiet-hover hover:text-quiet-text">Cancel</button> <button class="rounded-md bg-quiet-danger px-3.5 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90">${escape_html(confirmLabel)}</button></div></div></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]-->`);
  });
}
function NoteList($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    let noteEntries = [];
    let renamingPath = null;
    let renameValue = "";
    let confirmDelete = null;
    async function confirmDeleteNote() {
      if (!confirmDelete) return;
      const { path } = confirmDelete;
      confirmDelete = null;
      await deleteNote(path);
    }
    function noteBtnClass(isActive) {
      const base = "flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-left text-xs transition-colors";
      if (isActive) {
        return `${base} bg-quiet-active text-quiet-text font-medium`;
      }
      return `${base} text-quiet-muted hover:bg-quiet-hover hover:text-quiet-text`;
    }
    if (noteEntries.length === 0) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="px-3 py-2 text-xs text-quiet-faded">No notes</div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<div class="space-y-px"><!--[-->`);
      const each_array = ensure_array_like(noteEntries);
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let entry = each_array[$$index];
        $$renderer2.push(`<div class="group relative flex items-center">`);
        if (renamingPath === entry.path) {
          $$renderer2.push("<!--[0-->");
          $$renderer2.push(`<input type="text"${attr("value", renameValue)} class="w-full rounded-md border border-quiet-border bg-quiet-surface px-2.5 py-1.5 text-xs text-quiet-text outline-none transition-colors focus:border-quiet-accent/50"/>`);
        } else {
          $$renderer2.push("<!--[-1-->");
          $$renderer2.push(`<button${attr_class(clsx(noteBtnClass(store_get($$store_subs ??= {}, "$currentNote", currentNote)?.path === entry.path)))}><svg class="h-3.5 w-3.5 shrink-0" viewBox="0 0 16 16" fill="currentColor"><path d="M2 1.75C2 .784 2.784 0 3.75 0h5.586c.464 0 .909.184 1.237.513l2.914 2.914c.329.328.513.773.513 1.237v9.586A1.75 1.75 0 0 1 12.25 16h-8.5A1.75 1.75 0 0 1 2 14.25V1.75Z"></path></svg> <span class="truncate pr-14">${escape_html(entry.name)}</span></button> <div class="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 opacity-0 transition-all group-hover:opacity-100"><button class="rounded p-1 text-quiet-faded hover:bg-quiet-hover hover:text-quiet-text" title="Rename note"><svg class="h-3 w-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11.013 1.427a1.75 1.75 0 0 1 2.474 0l1.086 1.086a1.75 1.75 0 0 1 0 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 0 1-.927-.928l.929-3.25a1.75 1.75 0 0 1 .445-.758l8.61-8.61Z"></path></svg></button> <button class="rounded p-1 text-quiet-faded hover:bg-quiet-hover hover:text-quiet-danger" title="Delete note"><svg class="h-3 w-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M3 4h10M5 4v10a1 1 0 001 1h4a1 1 0 001-1V4M6.5 4V2.5a.5.5 0 01.5-.5h2a.5.5 0 01.5.5V4" stroke-linecap="round" stroke-linejoin="round"></path></svg></button></div>`);
        }
        $$renderer2.push(`<!--]--></div>`);
      }
      $$renderer2.push(`<!--]--></div>`);
    }
    $$renderer2.push(`<!--]--> `);
    ConfirmModal($$renderer2, {
      open: confirmDelete !== null,
      title: "Delete note",
      message: confirmDelete ? `Delete "${confirmDelete.name}"?` : "",
      confirmLabel: "Delete",
      onconfirm: confirmDeleteNote,
      oncancel: () => confirmDelete = null
    });
    $$renderer2.push(`<!---->`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
  });
}
function SearchBar($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    let query = "";
    let scope = "all";
    const SCOPE_LABELS = {
      "current-note": "Note",
      "current-folder": "Folder",
      "all": "All"
    };
    $$renderer2.push(`<div class="relative"><div class="relative"><svg class="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-quiet-faded pointer-events-none" viewBox="0 0 16 16" fill="currentColor"><path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"></path></svg> <input type="text" placeholder="Search notes…"${attr("value", query)} class="w-full rounded-md border border-quiet-border/70 bg-quiet-surface/60 py-1.5 pl-9 pr-3 text-xs text-quiet-text placeholder-quiet-faded outline-none transition-colors focus:border-quiet-accent/40 focus:bg-quiet-surface focus:ring-1 focus:ring-quiet-accent/20"/></div> <div class="mt-1.5 flex gap-1"><!--[-->`);
    const each_array = ensure_array_like(["current-note", "current-folder", "all"]);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let s = each_array[$$index];
      $$renderer2.push(`<button${attr_class(`rounded px-2 py-0.5 text-[10px] font-medium transition-colors ${scope === s ? "bg-quiet-accent/15 text-quiet-accent" : "text-quiet-faded hover:bg-quiet-hover hover:text-quiet-muted"}`)}>${escape_html(SCOPE_LABELS[s])}</button>`);
    }
    $$renderer2.push(`<!--]--></div> `);
    if (query.trim() && store_get($$store_subs ??= {}, "$searchResultCount", searchResultCount) >= 0) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="mt-1.5 px-1 text-[11px] text-quiet-faded">`);
      if (store_get($$store_subs ??= {}, "$searchResultCount", searchResultCount) === 0) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`No notes found`);
      } else {
        $$renderer2.push("<!--[-1-->");
        $$renderer2.push(`${escape_html(store_get($$store_subs ??= {}, "$searchResultCount", searchResultCount))} note${escape_html(store_get($$store_subs ??= {}, "$searchResultCount", searchResultCount) === 1 ? "" : "s")} found`);
      }
      $$renderer2.push(`<!--]--></div> `);
      if (store_get($$store_subs ??= {}, "$searchResultCount", searchResultCount) > 0) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<div class="mt-1 max-h-40 overflow-y-auto rounded-md border border-quiet-border/70 bg-quiet-surface shadow-lg"><!--[-->`);
        const each_array_1 = ensure_array_like(store_get($$store_subs ??= {}, "$searchResults", searchResults));
        for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
          let result = each_array_1[$$index_1];
          $$renderer2.push(`<button class="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-quiet-muted transition-colors hover:bg-quiet-hover hover:text-quiet-text"><span class="truncate">${escape_html(result.name)}</span> <span class="shrink-0 truncate text-[10px] text-quiet-faded">${escape_html(result.path.split("/").slice(-2, -1).join("/"))}</span></button>`);
        }
        $$renderer2.push(`<!--]--></div>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]-->`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></div>`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
  });
}
function Sidebar($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    let newNoteName = "";
    $$renderer2.push(`<aside${attr_class(`flex shrink-0 flex-col border-r border-quiet-border/70 bg-quiet-surface/40 transition-all duration-150 ease-out ${store_get($$store_subs ??= {}, "$sidebarCollapsed", sidebarCollapsed) ? "w-10" : "w-64"}`)}>`);
    if (!store_get($$store_subs ??= {}, "$sidebarCollapsed", sidebarCollapsed)) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="border-b border-quiet-border/60 px-4 py-4"><h1 class="text-sm font-semibold tracking-tight text-quiet-text">Quietness</h1> <p class="text-xs text-quiet-faded">A quiet place to write.</p></div> <div class="px-3 pt-3 pb-1">`);
      SearchBar($$renderer2);
      $$renderer2.push(`<!----></div> <div class="overflow-y-auto"><div class="px-2 pt-3 pb-1"><span class="px-1 text-[10px] font-medium uppercase tracking-wider text-quiet-faded">Folders</span></div> `);
      FolderTree($$renderer2);
      $$renderer2.push(`<!----> <div class="mt-4 px-2 pt-3 pb-1 flex items-center justify-between border-t border-quiet-border/60"><span class="px-1 text-[10px] font-medium uppercase tracking-wider text-quiet-faded">Notes</span> <button class="rounded px-1.5 py-0.5 text-xs text-quiet-faded transition-colors hover:bg-quiet-hover hover:text-quiet-text">+ New</button></div> `);
      if (store_get($$store_subs ??= {}, "$showNewNoteInput", showNewNoteInput)) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<div class="px-3 pb-2"><input type="text" placeholder="Note name..."${attr("value", newNoteName)} class="w-full rounded-md border border-quiet-border bg-quiet-surface px-2.5 py-1.5 text-xs text-quiet-text placeholder-quiet-faded outline-none transition-colors focus:border-quiet-accent/50"/></div>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> `);
      NoteList($$renderer2);
      $$renderer2.push(`<!----></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> <button class="mt-auto flex items-center justify-center border-t border-quiet-border/60 p-2.5 text-quiet-faded transition-colors hover:bg-quiet-hover hover:text-quiet-text"${attr("title", store_get($$store_subs ??= {}, "$sidebarCollapsed", sidebarCollapsed) ? "Expand sidebar" : "Collapse sidebar")}>`);
    if (store_get($$store_subs ??= {}, "$sidebarCollapsed", sidebarCollapsed)) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<svg class="h-4 w-4" viewBox="0 0 16 16" fill="currentColor"><path d="M6.47 4.22a.75.75 0 0 1 1.06 0l3.75 3.75a.75.75 0 0 1 0 1.06l-3.75 3.75a.75.75 0 0 1-1.06-1.06L9.69 8 6.47 4.78a.75.75 0 0 1 0-1.06Z"></path></svg>`);
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<svg class="h-4 w-4" viewBox="0 0 16 16" fill="currentColor"><path d="M9.53 4.22a.75.75 0 0 0-1.06 0L4.72 7.97a.75.75 0 0 0 0 1.06l3.75 3.75a.75.75 0 0 0 1.06-1.06L6.31 8l3.22-3.22a.75.75 0 0 0 0-1.06Z"></path></svg>`);
    }
    $$renderer2.push(`<!--]--></button></aside>`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
  });
}
const DEFAULT_SETTINGS = {
  theme: "quiet",
  fonts: {
    ui: "Inter",
    editor: "JetBrains Mono",
    preview: "Inter"
  },
  sizes: {
    ui: 14,
    editor: 14,
    preview: 16
  },
  editor: {
    lineNumbers: true,
    wordWrap: false,
    tabSize: 4,
    dimInactiveLines: false,
    smoothCaret: true
  }
};
function createSettingsStore() {
  const { subscribe, set, update } = writable({ ...DEFAULT_SETTINGS });
  let ready = false;
  let saveTimeout = null;
  function scheduleSave(settings2) {
    if (!ready) return;
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      invoke("save_settings", { settings: settings2 }).catch((e) => {
        showError(`Failed to save settings: ${e}`);
      });
    }, 300);
  }
  return {
    subscribe,
    set(value) {
      set(value);
      scheduleSave(value);
    },
    update(fn) {
      update((current) => {
        const next = fn(current);
        scheduleSave(next);
        return next;
      });
    },
    async load() {
      try {
        const saved = await invoke("load_settings");
        if (saved) {
          set({ ...DEFAULT_SETTINGS, ...saved });
        }
      } catch (e) {
        showError(`Failed to load settings: ${e}`);
      } finally {
        ready = true;
      }
    }
  };
}
const settings = createSettingsStore();
function NoteEditor($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    let { content = "" } = $$props;
    new Compartment();
    new Compartment();
    new Compartment();
    new Compartment();
    new Compartment();
    EditorView.theme({
      "&": { backgroundColor: "var(--q-bg)", color: "var(--q-text)" },
      ".cm-gutters": {
        backgroundColor: "var(--q-surface)",
        borderRight: "1px solid var(--q-border)",
        color: "var(--q-faded)"
      },
      ".cm-activeLineGutter": { backgroundColor: "var(--q-hover)" },
      ".cm-activeLine": { backgroundColor: "var(--q-hover)" },
      ".cm-selectionBackground": { backgroundColor: "var(--q-selection-bg-inactive) !important" },
      "&.cm-focused .cm-selectionBackground": { backgroundColor: "var(--q-selection-bg) !important" },
      ".cm-content ::selection": { backgroundColor: "var(--q-selection-bg)" },
      ".cm-line::selection, .cm-line ::selection": { backgroundColor: "var(--q-selection-bg)" },
      ".cm-cursor": { borderLeftColor: "var(--q-accent)" },
      "&.cm-focused": { outline: "none" }
    });
    keymap.of([
      {
        key: "`",
        run: (view) => {
          const { state } = view;
          const pos = state.selection.main.head;
          const charAt = state.sliceDoc(pos, pos + 1);
          if (charAt === "`") {
            view.dispatch({
              changes: { from: pos, to: pos + 1 },
              selection: { anchor: pos + 1, head: pos + 1 }
            });
            return true;
          }
          view.dispatch({
            changes: { from: pos, insert: "``" },
            selection: { anchor: pos + 1, head: pos + 1 }
          });
          return true;
        }
      }
    ]);
    let noteName = derived(() => store_get($$store_subs ??= {}, "$currentNote", currentNote)?.name ?? "");
    let wordCount = derived(() => content ? content.trim() === "" ? 0 : content.trim().split(/\s+/).length : 0);
    let charCount = derived(() => content ? content.length : 0);
    $$renderer2.push(`<div class="flex h-full min-h-0 w-full flex-col">`);
    if (store_get($$store_subs ??= {}, "$currentNote", currentNote)) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="title-bar svelte-hrl8lz">`);
      {
        $$renderer2.push("<!--[-1-->");
        $$renderer2.push(`<button class="title-button svelte-hrl8lz">${escape_html(noteName())}</button>`);
      }
      $$renderer2.push(`<!--]--></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> <div class="min-h-0 flex-1 overflow-hidden"></div> `);
    if (store_get($$store_subs ??= {}, "$currentNote", currentNote)) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="word-count svelte-hrl8lz">${escape_html(wordCount())} words · ${escape_html(charCount())} characters</div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></div>`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
  });
}
function wikilinksPlugin(md2) {
  md2.inline.ruler.before("link", "wikilink", (state, silent) => {
    const pos = state.pos;
    const max = state.posMax;
    if (pos + 1 >= max) return false;
    if (state.src.charCodeAt(pos) !== 91) return false;
    if (state.src.charCodeAt(pos + 1) !== 91) return false;
    let close = -1;
    const closeIdx = state.src.indexOf("]]", pos + 2);
    if (closeIdx !== -1 && closeIdx + 2 <= max) {
      let valid = true;
      for (let i = pos + 2; i < closeIdx; i++) {
        const code = state.src.charCodeAt(i);
        if (code === 91 || code === 10) {
          valid = false;
          break;
        }
      }
      if (valid) close = closeIdx;
    }
    if (close === -1) return false;
    const content = state.src.slice(pos + 2, close);
    if (!silent) {
      const pipeIndex = content.indexOf("|");
      const target = (pipeIndex !== -1 ? content.slice(0, pipeIndex) : content).trim();
      const display = (pipeIndex !== -1 ? content.slice(pipeIndex + 1) : content).trim();
      const existing = state.env?.existingNotes;
      const exists = existing ? existing.has(target.toLowerCase()) : false;
      const linkClass = exists ? "wikilink" : "wikilink broken";
      const token = state.push("link_open", "a", 1);
      token.attrs = [
        ["href", "#"],
        ["data-wikilink", target],
        ["class", linkClass]
      ];
      const textToken = state.push("text", "", 0);
      textToken.content = display;
      state.push("link_close", "a", -1);
    }
    state.pos = close + 2;
    return true;
  });
}
function tasklistsPlugin(md2) {
  md2.core.ruler.after("inline", "tasklists", (state) => {
    const tokens = state.tokens;
    for (let i = 0; i < tokens.length; i++) {
      if (tokens[i].type !== "inline") continue;
      const content = tokens[i].content;
      const match = content.match(/^\[([ x])\]\s+/);
      if (!match) continue;
      let inListItem = false;
      for (let j = i - 1; j >= 0; j--) {
        if (tokens[j].type === "list_item_open") {
          inListItem = true;
          tokens[j].attrJoin("class", "task-list-item");
          break;
        }
        if (tokens[j].type === "bullet_list_close" || tokens[j].type === "ordered_list_close") {
          break;
        }
      }
      if (!inListItem) continue;
      const checked = match[1] === "x";
      tokens[i].content = content.slice(match[0].length);
      const children = tokens[i].children;
      if (children && children.length > 0) {
        const firstChild = children[0];
        if (firstChild.type === "text") {
          firstChild.content = firstChild.content.slice(match[0].length);
        }
      }
      const checkboxHtml = checked ? '<input type="checkbox" class="task-checkbox" checked disabled> ' : '<input type="checkbox" class="task-checkbox" disabled> ';
      const checkboxToken = new state.Token("html_inline", "", 0);
      checkboxToken.content = checkboxHtml;
      if (children) {
        children.unshift(checkboxToken);
      }
    }
  });
}
const md = new MarkdownIt({
  html: false,
  linkify: false,
  typographer: false
});
md.use(wikilinksPlugin);
md.use(tasklistsPlugin);
function NotePreview($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let renderedHTML = "";
    $$renderer2.push(`<div class="preview-content" role="region">${html(renderedHTML)}</div>`);
  });
}
function createUserThemesStore() {
  const { subscribe, set, update } = writable({ list: [], cssMap: {} });
  let currentState = { cssMap: {} };
  subscribe((v) => currentState = v);
  return {
    subscribe,
    set,
    update,
    load: async () => {
      try {
        const entries = await invoke("list_user_themes");
        const map = {};
        for (const entry of entries) {
          try {
            map[entry.id] = await invoke("read_user_theme_css", { id: entry.id });
          } catch (e) {
            console.error(`Failed to read user theme "${entry.id}":`, e);
          }
        }
        set({ list: entries, cssMap: map });
      } catch (e) {
        showError(`Failed to load user themes: ${e}`);
      }
    },
    getCss: (id) => {
      return currentState.cssMap[id];
    }
  };
}
const userThemes = createUserThemesStore();
const AVAILABLE_THEMES = [
  { id: "quiet", name: "Quiet Light", description: "Warm paper background, soft contrast", colors: { bg: "#f8f5f0", surface: "#f2eee8", text: "#2a2724", accent: "#6b615a", muted: "#7d7570" } },
  { id: "quiet-dark", name: "Quiet Dark", description: "Dark background, muted tones", colors: { bg: "#1e1e1e", surface: "#252525", text: "#d4d4d4", accent: "#8b8178", muted: "#888888" } },
  { id: "catppuccin-latte", name: "Catppuccin Latte", description: "Warm, gentle pastels", colors: { bg: "#eff1f5", surface: "#e6e9ef", text: "#4c4f69", accent: "#8839ef", muted: "#7c7f93" } },
  { id: "catppuccin-mocha", name: "Catppuccin Mocha", description: "Rich, cozy dark pastels", colors: { bg: "#1e1e2e", surface: "#181825", text: "#cdd6f4", accent: "#cba6f7", muted: "#a6adc8" } },
  { id: "everforest-day", name: "Everforest Day", description: "Soft green-tinted light", colors: { bg: "#fdf6e3", surface: "#f5edd6", text: "#5c6a64", accent: "#7a9e7e", muted: "#9da9a0" } },
  { id: "everforest-night", name: "Everforest Night", description: "Deep green-tinted dark", colors: { bg: "#2d353b", surface: "#343f44", text: "#d3c6aa", accent: "#a7c080", muted: "#859289" } },
  { id: "github-light", name: "GitHub Light", description: "Clean, neutral light", colors: { bg: "#ffffff", surface: "#f6f8fa", text: "#1f2328", accent: "#0969da", muted: "#656d76" } },
  { id: "github-dark", name: "GitHub Dark", description: "Clean, neutral dark", colors: { bg: "#0d1117", surface: "#161b22", text: "#e6edf3", accent: "#58a6ff", muted: "#8b949e" } },
  { id: "nord", name: "Nord", description: "Arctic, bluish cool tones", colors: { bg: "#eceff4", surface: "#e5e9f0", text: "#2e3440", accent: "#5e81ac", muted: "#7b88a1" } }
];
function SettingsModal($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    let { open = false } = $$props;
    let activeTab = "theme";
    if (open) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/30" role="dialog" aria-modal="true" aria-label="Settings"><div class="mx-4 flex w-[560px] max-w-full flex-col rounded-xl border border-quiet-border bg-[var(--q-bg)] shadow-xl" style="max-height: 80vh;"><div class="flex items-center justify-between border-b border-quiet-border/60 px-6 py-4"><h2 class="text-sm font-semibold text-quiet-text">Settings</h2> <button class="rounded-md p-1.5 text-quiet-faded transition-colors hover:bg-quiet-hover hover:text-quiet-text" aria-label="Close settings"><svg class="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M4 4l8 8M12 4l-8 8"></path></svg></button></div> <div class="flex border-b border-quiet-border/60 px-6"><!--[-->`);
      const each_array = ensure_array_like([
        { id: "theme", label: "Theme" },
        { id: "fonts", label: "Fonts" },
        { id: "editor", label: "Editor" }
      ]);
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let tab = each_array[$$index];
        $$renderer2.push(`<button${attr_class(`border-b-2 px-4 py-3 text-xs font-medium transition-colors ${activeTab === tab.id ? "border-quiet-accent text-quiet-text" : "border-transparent text-quiet-faded hover:text-quiet-muted"}`)}>${escape_html(tab.label)}</button>`);
      }
      $$renderer2.push(`<!--]--></div> <div class="flex-1 overflow-y-auto p-6">`);
      {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<div class="mb-6"><h3 class="mb-3 text-[11px] font-medium uppercase tracking-wider text-quiet-faded">Built-in Themes</h3> <div class="grid grid-cols-3 gap-3"><!--[-->`);
        const each_array_1 = ensure_array_like(AVAILABLE_THEMES);
        for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
          let theme = each_array_1[$$index_1];
          const active = store_get($$store_subs ??= {}, "$settings", settings).theme === theme.id;
          const c = theme.colors;
          $$renderer2.push(`<button${attr_class(`rounded-lg border-2 p-4 text-left transition-all ${active ? "border-quiet-accent ring-1 ring-quiet-accent/30" : "border-quiet-border/60 hover:border-quiet-border hover:bg-quiet-hover"}`)}><div class="mb-3 flex gap-1"><span class="h-5 w-5 rounded-full border border-quiet-border/50"${attr_style(`background: ${stringify(c.bg)}`)} title="Background"></span> <span class="h-5 w-5 rounded-full border border-quiet-border/50"${attr_style(`background: ${stringify(c.surface)}`)} title="Surface"></span> <span class="h-5 w-5 rounded-full border border-quiet-border/50"${attr_style(`background: ${stringify(c.text)}`)} title="Text"></span> <span class="h-5 w-5 rounded-full border border-quiet-border/50"${attr_style(`background: ${stringify(c.accent)}`)} title="Accent"></span> <span class="h-5 w-5 rounded-full border border-quiet-border/50"${attr_style(`background: ${stringify(c.muted)}`)} title="Muted"></span></div> <div class="text-xs font-medium text-quiet-text">${escape_html(theme.name)}</div> <div class="mt-0.5 text-[11px] text-quiet-faded">${escape_html(theme.description)}</div></button>`);
        }
        $$renderer2.push(`<!--]--></div></div> `);
        if (store_get($$store_subs ??= {}, "$userThemes", userThemes).list.length > 0) {
          $$renderer2.push("<!--[0-->");
          $$renderer2.push(`<div><h3 class="mb-3 text-[11px] font-medium uppercase tracking-wider text-quiet-faded">User Themes</h3> <div class="grid grid-cols-3 gap-3"><!--[-->`);
          const each_array_2 = ensure_array_like(store_get($$store_subs ??= {}, "$userThemes", userThemes).list);
          for (let $$index_2 = 0, $$length = each_array_2.length; $$index_2 < $$length; $$index_2++) {
            let theme = each_array_2[$$index_2];
            const active = store_get($$store_subs ??= {}, "$settings", settings).theme === theme.id;
            $$renderer2.push(`<button${attr_class(`rounded-lg border-2 p-4 text-left transition-all ${active ? "border-quiet-accent ring-1 ring-quiet-accent/30" : "border-quiet-border/60 hover:border-quiet-border hover:bg-quiet-hover"}`)}><div class="mb-2 flex h-10 items-center justify-center rounded bg-quiet-surface/50"><svg class="h-5 w-5 text-quiet-muted" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clip-rule="evenodd"></path></svg></div> <div class="text-xs font-medium text-quiet-text">${escape_html(theme.name)}</div> <div class="mt-0.5 text-[11px] text-quiet-faded">Custom theme</div></button>`);
          }
          $$renderer2.push(`<!--]--></div></div>`);
        } else {
          $$renderer2.push("<!--[-1-->");
          $$renderer2.push(`<div class="rounded-lg border border-dashed border-quiet-border/60 p-6 text-center"><p class="text-xs text-quiet-faded">Place <code class="rounded bg-quiet-surface px-1 py-0.5 text-[11px]">.css</code> files in the <code class="rounded bg-quiet-surface px-1 py-0.5 text-[11px]">_themes/</code> folder inside your notes directory to see them here.</p></div>`);
        }
        $$renderer2.push(`<!--]-->`);
      }
      $$renderer2.push(`<!--]--></div> <div class="flex items-center justify-end border-t border-quiet-border/60 px-6 py-3"><button class="rounded-md bg-quiet-accent px-4 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90">Done</button></div></div></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]-->`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
  });
}
const viewMode = writable("split");
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    const modes = [
      { value: "edit", label: "Edit" },
      { value: "split", label: "Split" },
      { value: "preview", label: "Preview" }
    ];
    let showSettings = false;
    let confirmDelete = false;
    onDestroy(() => {
    });
    async function confirmDeleteNote() {
      if (!store_get($$store_subs ??= {}, "$currentNote", currentNote)) return;
      confirmDelete = false;
      await deleteNote(store_get($$store_subs ??= {}, "$currentNote", currentNote).path);
    }
    head("1uha8ag", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>Quietness</title>`);
      });
      $$renderer3.push(`<meta name="description" content="Offline note taking app with a calm, minimal writing surface."/>`);
    });
    $$renderer2.push(`<div class="flex h-screen min-h-0 overflow-hidden">`);
    Sidebar($$renderer2);
    $$renderer2.push(`<!----> <main class="flex min-h-0 flex-1 flex-col overflow-hidden"><div class="flex items-center justify-between border-b border-quiet-border/60 px-6 py-3"><div class="flex items-center gap-3">`);
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></div> <div class="flex items-center gap-2">`);
    if (store_get($$store_subs ??= {}, "$currentNote", currentNote)) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="flex overflow-hidden rounded-md border border-quiet-border/60"><!--[-->`);
      const each_array = ensure_array_like(modes);
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let mode = each_array[$$index];
        $$renderer2.push(`<button${attr_class(`px-3 py-1 text-xs transition-all duration-150 ease-out ${store_get($$store_subs ??= {}, "$viewMode", viewMode) === mode.value ? "bg-quiet-accent text-white" : "text-quiet-faded hover:bg-quiet-hover hover:text-quiet-text"}`)}>${escape_html(mode.label)}</button>`);
      }
      $$renderer2.push(`<!--]--></div> <button class="rounded-md px-3 py-1 text-xs text-quiet-faded transition-colors hover:bg-quiet-hover hover:text-quiet-text">Save</button> <button class="rounded-md px-3 py-1 text-xs text-quiet-danger/70 transition-colors hover:bg-quiet-danger-bg hover:text-quiet-danger">Delete</button>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> <button class="rounded-md p-1.5 text-quiet-faded transition-colors hover:bg-quiet-hover hover:text-quiet-text" aria-label="Settings"><svg class="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="1.5"></circle><path d="M8 1.5v1M8 13.5v1M3.3 3.3l.7.7M12 12l.7.7M1.5 8h1M13.5 8h1M3.3 12.7l.7-.7M12 4l.7-.7"></path></svg></button></div></div> `);
    if (store_get($$store_subs ??= {}, "$currentNote", currentNote)) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="flex min-h-0 flex-1">`);
      if (store_get($$store_subs ??= {}, "$viewMode", viewMode) === "edit" || store_get($$store_subs ??= {}, "$viewMode", viewMode) === "split") {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<div${attr_class(`${store_get($$store_subs ??= {}, "$viewMode", viewMode) === "split" ? "min-h-0 flex-1 border-r border-quiet-border/60" : "min-h-0 flex-1"} overflow-hidden`)}><div class="flex h-full min-h-0 flex-col"><div class="border-b border-quiet-border/60 px-4 py-1.5 text-[10px] font-medium uppercase tracking-wider text-quiet-faded">Editor</div> <div class="min-h-0 flex-1">`);
        NoteEditor($$renderer2, {
          content: store_get($$store_subs ??= {}, "$currentNote", currentNote).content
        });
        $$renderer2.push(`<!----></div></div></div>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> `);
      if (store_get($$store_subs ??= {}, "$viewMode", viewMode) === "preview" || store_get($$store_subs ??= {}, "$viewMode", viewMode) === "split") {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<div class="min-h-0 flex-1 overflow-hidden"><div class="flex h-full min-h-0 flex-col"><div class="border-b border-quiet-border/60 px-4 py-1.5 text-[10px] font-medium uppercase tracking-wider text-quiet-faded">Preview</div> <div class="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-6">`);
        NotePreview($$renderer2, {
          content: store_get($$store_subs ??= {}, "$currentNote", currentNote).content
        });
        $$renderer2.push(`<!----></div></div></div>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<div class="flex flex-1 items-center justify-center"><div class="text-center"><h2 class="text-xl font-semibold tracking-tight text-quiet-muted">Welcome to Quietness</h2> <p class="mt-2 text-sm text-quiet-faded">Select a note from the sidebar to start writing.</p></div></div>`);
    }
    $$renderer2.push(`<!--]--></main> `);
    if (store_get($$store_subs ??= {}, "$errorMessage", errorMessage).length > 0) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="fixed bottom-4 right-4 z-50 flex flex-col gap-2"><!--[-->`);
      const each_array_1 = ensure_array_like(store_get($$store_subs ??= {}, "$errorMessage", errorMessage));
      for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
        let error = each_array_1[$$index_1];
        $$renderer2.push(`<div class="flex max-w-sm items-center gap-3 rounded-lg border border-quiet-danger/20 bg-quiet-danger-bg/95 px-4 py-3 shadow-sm backdrop-blur-sm transition-all duration-300 ease-in-out"><svg class="h-4 w-4 shrink-0 text-quiet-danger" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg> <div class="flex-1 text-xs font-medium text-quiet-danger">${escape_html(error.message)}</div> <button class="shrink-0 rounded p-0.5 text-quiet-danger/60 transition-colors hover:text-quiet-danger" aria-label="Dismiss error"><svg class="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M4 4l8 8M12 4l-8 8"></path></svg></button></div>`);
      }
      $$renderer2.push(`<!--]--></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></div> `);
    SettingsModal($$renderer2, { open: showSettings });
    $$renderer2.push(`<!----> `);
    ConfirmModal($$renderer2, {
      open: confirmDelete && store_get($$store_subs ??= {}, "$currentNote", currentNote) !== null,
      title: "Delete note",
      message: store_get($$store_subs ??= {}, "$currentNote", currentNote) ? `Delete "${store_get($$store_subs ??= {}, "$currentNote", currentNote).name}"?` : "",
      confirmLabel: "Delete",
      onconfirm: confirmDeleteNote,
      oncancel: () => confirmDelete = false
    });
    $$renderer2.push(`<!---->`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
  });
}
export {
  _page as default
};
