import { a8 as ssr_context, k as attr_class, p as clsx, a9 as store_get, z as ensure_array_like, ad as unsubscribe_stores, l as attr_style, A as escape_html, aa as stringify, j as attr, w as derived, M as head } from "../../chunks/renderer.js";
import "clsx";
import { w as writable } from "../../chunks/index.js";
import { invoke } from "@tauri-apps/api/core";
import { Compartment } from "@codemirror/state";
import MarkdownIt from "markdown-it";
function html(value) {
  var html2 = String(value ?? "");
  var open = "<!---->";
  return open + html2 + "<!---->";
}
function onDestroy(fn) {
  /** @type {SSRContext} */
  ssr_context.r.on_destroy(fn);
}
const selectedFolder = writable(null);
function FolderTree($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    let tree = [];
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
        $$renderer3.push(`<span${attr_class(`inline-flex h-3.5 w-3.5 shrink-0 cursor-pointer items-center justify-center transition-transform ${node.expanded ? "rotate-90" : ""}`)} role="button" tabindex="0"><svg viewBox="0 0 16 16" fill="currentColor" class="h-3 w-3"><path d="M6 4l4 4-4 4"></path></svg></span>`);
      } else {
        $$renderer3.push("<!--[-1-->");
        $$renderer3.push(`<span class="inline-flex w-3.5 shrink-0"></span>`);
      }
      $$renderer3.push(`<!--]--> <svg class="h-3.5 w-3.5 shrink-0" viewBox="0 0 16 16" fill="currentColor"><path d="M.5 3.5a2 2 0 0 1 2-2h3.672a2 2 0 0 1 1.414.586l.828.828A2 2 0 0 0 9.828 3h3.672a2 2 0 0 1 2 2v6.5a2 2 0 0 1-2 2h-11a2 2 0 0 1-2-2v-7.5Z"></path></svg> <span class="truncate">${escape_html(node.name)}</span></button> `);
      if (node.expanded && node.children.length > 0) {
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
const notes = writable([]);
const currentNote = writable(null);
const errorMessage = writable(null);
function NoteList($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    let noteEntries = [];
    function noteBtnClass(isActive) {
      const base = "flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-left text-xs transition-colors";
      if (isActive) {
        return `${base} bg-quiet-active text-quiet-text font-medium`;
      }
      return `${base} text-quiet-muted hover:bg-quiet-hover hover:text-quiet-text`;
    }
    if (noteEntries.length === 0) {
      $$renderer2.push("<!--[1-->");
      $$renderer2.push(`<div class="px-3 py-2 text-xs text-quiet-faded">No notes</div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<div class="space-y-px"><!--[-->`);
      const each_array = ensure_array_like(noteEntries);
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let entry = each_array[$$index];
        $$renderer2.push(`<div class="group relative flex items-center"><button${attr_class(clsx(noteBtnClass(store_get($$store_subs ??= {}, "$currentNote", currentNote)?.path === entry.path)))}><svg class="h-3.5 w-3.5 shrink-0" viewBox="0 0 16 16" fill="currentColor"><path d="M2 1.75C2 .784 2.784 0 3.75 0h5.586c.464 0 .909.184 1.237.513l2.914 2.914c.329.328.513.773.513 1.237v9.586A1.75 1.75 0 0 1 12.25 16h-8.5A1.75 1.75 0 0 1 2 14.25V1.75Z"></path></svg> <span class="truncate pr-5">${escape_html(entry.name)}</span></button> <button class="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-quiet-faded opacity-0 transition-all hover:bg-quiet-hover hover:text-quiet-danger group-hover:opacity-100" title="Delete note"><svg class="h-3 w-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 4h10M5 4v10a1 1 0 001 1h4a1 1 0 001-1V4M6.5 4V2.5a.5.5 0 01.5-.5h2a.5.5 0 01.5.5V4" stroke-linecap="round" stroke-linejoin="round"></path></svg></button></div>`);
      }
      $$renderer2.push(`<!--]--></div>`);
    }
    $$renderer2.push(`<!--]-->`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
  });
}
function SearchBar($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let query = "";
    $$renderer2.push(`<div class="relative"><svg class="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-quiet-faded" viewBox="0 0 16 16" fill="currentColor"><path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"></path></svg> <input type="text" placeholder="Search notes…"${attr("value", query)} class="w-full rounded-md border border-quiet-border/70 bg-white/70 py-1.5 pl-9 pr-3 text-xs text-quiet-text placeholder-quiet-faded outline-none transition-colors focus:border-quiet-accent/40 focus:bg-white focus:ring-1 focus:ring-quiet-accent/20"/></div>`);
  });
}
function Sidebar($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    $$renderer2.push(`<aside class="flex w-64 shrink-0 flex-col border-r border-quiet-border/70 bg-quiet-surface/40"><div class="border-b border-quiet-border/60 px-4 py-4"><h1 class="text-sm font-semibold tracking-tight text-quiet-text">Quietness</h1> <p class="text-xs text-quiet-faded">A quiet place to write.</p></div> <div class="px-3 pt-3 pb-1">`);
    SearchBar($$renderer2);
    $$renderer2.push(`<!----></div> <div class="overflow-y-auto"><div class="px-2 pt-3 pb-1"><span class="px-1 text-[10px] font-medium uppercase tracking-wider text-quiet-faded">Folders</span></div> `);
    FolderTree($$renderer2);
    $$renderer2.push(`<!----> <div class="mt-4 px-2 pt-3 pb-1 flex items-center justify-between border-t border-quiet-border/60"><span class="px-1 text-[10px] font-medium uppercase tracking-wider text-quiet-faded">Notes</span> <button class="rounded px-1.5 py-0.5 text-xs text-quiet-faded transition-colors hover:bg-quiet-hover hover:text-quiet-text">+ New</button></div> `);
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    NoteList($$renderer2);
    $$renderer2.push(`<!----></div></aside>`);
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
    tabSize: 4
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
        console.error("Failed to save settings:", e);
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
        console.error("Failed to load settings:", e);
      } finally {
        ready = true;
      }
    }
  };
}
const settings = createSettingsStore();
function NoteEditor($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    new Compartment();
    new Compartment();
    new Compartment();
    $$renderer2.push(`<div class="h-full w-full"></div>`);
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
    for (let i = pos + 2; i < max; i++) {
      const code = state.src.charCodeAt(i);
      if (code === 91) {
        return false;
      }
      if (code === 10) {
        return false;
      }
      if (code === 93 && i + 1 < max && state.src.charCodeAt(i + 1) === 93) {
        close = i;
        break;
      }
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
const md = new MarkdownIt({
  html: false,
  linkify: false,
  typographer: false
});
md.use(wikilinksPlugin);
function renderMarkdown(src, existingNotes) {
  return md.render(src, { existingNotes });
}
function NotePreview($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    let { content = "" } = $$props;
    let existingNoteNames = derived(() => new Set(store_get($$store_subs ??= {}, "$notes", notes).map((n) => n.name.toLowerCase())));
    $$renderer2.push(`<div class="preview-content" role="region">${html(renderMarkdown(content, existingNoteNames()))}</div>`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
  });
}
const AVAILABLE_THEMES = [
  { id: "quiet", name: "Quiet Light", description: "Warm paper background, soft contrast", colors: { bg: "#f8f5f0", surface: "#f2eee8", text: "#2a2724", accent: "#6b615a", muted: "#7d7570" } },
  { id: "quiet-dark", name: "Quiet Dark", description: "Dark background, muted tones", colors: { bg: "#1e1e1e", surface: "#252525", text: "#d4d4d4", accent: "#8b8178", muted: "#888888" } },
  { id: "catppuccin-latte", name: "Catppuccin Latte", description: "Warm, gentle pastels", colors: { bg: "#eff1f5", surface: "#e6e9ef", text: "#4c4f69", accent: "#8839ef", muted: "#9ca0b0" } },
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
        $$renderer2.push(`<div class="grid grid-cols-3 gap-3"><!--[-->`);
        const each_array_1 = ensure_array_like(AVAILABLE_THEMES);
        for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
          let theme = each_array_1[$$index_1];
          const active = store_get($$store_subs ??= {}, "$settings", settings).theme === theme.id;
          const c = theme.colors;
          $$renderer2.push(`<button${attr_class(`rounded-lg border-2 p-4 text-left transition-all ${active ? "border-quiet-accent ring-1 ring-quiet-accent/30" : "border-quiet-border/60 hover:border-quiet-border hover:bg-quiet-hover"}`)}><div class="mb-3 flex gap-1"><span class="h-5 w-5 rounded-full border border-quiet-border/50"${attr_style(`background: ${stringify(c.bg)}`)} title="Background"></span> <span class="h-5 w-5 rounded-full border border-quiet-border/50"${attr_style(`background: ${stringify(c.surface)}`)} title="Surface"></span> <span class="h-5 w-5 rounded-full border border-quiet-border/50"${attr_style(`background: ${stringify(c.text)}`)} title="Text"></span> <span class="h-5 w-5 rounded-full border border-quiet-border/50"${attr_style(`background: ${stringify(c.accent)}`)} title="Accent"></span> <span class="h-5 w-5 rounded-full border border-quiet-border/50"${attr_style(`background: ${stringify(c.muted)}`)} title="Muted"></span></div> <div class="text-xs font-medium text-quiet-text">${escape_html(theme.name)}</div> <div class="mt-0.5 text-[11px] text-quiet-faded">${escape_html(theme.description)}</div></button>`);
        }
        $$renderer2.push(`<!--]--></div>`);
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
    let isDeleting = false;
    let showSettings = false;
    onDestroy(() => {
    });
    head("1uha8ag", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>Quietness</title>`);
      });
      $$renderer3.push(`<meta name="description" content="Offline note taking app with a calm, minimal writing surface."/>`);
    });
    $$renderer2.push(`<div class="flex min-h-screen">`);
    Sidebar($$renderer2);
    $$renderer2.push(`<!----> <main class="flex flex-1 flex-col">`);
    if (store_get($$store_subs ??= {}, "$currentNote", currentNote)) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="flex items-center justify-between border-b border-quiet-border/60 px-6 py-3"><h2 class="text-sm font-medium text-quiet-muted">${escape_html(store_get($$store_subs ??= {}, "$currentNote", currentNote).name)}</h2> <div class="flex items-center gap-2"><button class="rounded-md p-1.5 text-quiet-faded transition-colors hover:bg-quiet-hover hover:text-quiet-text" aria-label="Settings"><svg class="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="1.5"></circle><path d="M8 1.5v1M8 13.5v1M3.3 3.3l.7.7M12 12l.7.7M1.5 8h1M13.5 8h1M3.3 12.7l.7-.7M12 4l.7-.7"></path></svg></button> <div class="flex overflow-hidden rounded-md border border-quiet-border/60"><!--[-->`);
      const each_array = ensure_array_like(modes);
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let mode = each_array[$$index];
        $$renderer2.push(`<button${attr_class(`px-3 py-1 text-xs transition-colors ${store_get($$store_subs ??= {}, "$viewMode", viewMode) === mode.value ? "bg-quiet-accent text-white" : "text-quiet-faded hover:bg-quiet-hover hover:text-quiet-text"}`)}>${escape_html(mode.label)}</button>`);
      }
      $$renderer2.push(`<!--]--></div> <button class="rounded-md px-3 py-1 text-xs text-quiet-faded transition-colors hover:bg-quiet-hover hover:text-quiet-text">Save</button> <button${attr("disabled", isDeleting, true)} class="rounded-md px-3 py-1 text-xs text-quiet-danger/70 transition-colors hover:bg-quiet-danger-bg hover:text-quiet-danger disabled:opacity-50">Delete</button></div></div> <div class="flex flex-1">`);
      if (store_get($$store_subs ??= {}, "$viewMode", viewMode) === "edit" || store_get($$store_subs ??= {}, "$viewMode", viewMode) === "split") {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<div${attr_class(`${store_get($$store_subs ??= {}, "$viewMode", viewMode) === "split" ? "flex-1 border-r border-quiet-border/60" : "flex-1"} overflow-hidden`)}><div class="flex h-full flex-col"><div class="border-b border-quiet-border/60 px-4 py-1.5 text-[10px] font-medium uppercase tracking-wider text-quiet-faded">Editor</div> <div class="flex-1">`);
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
        $$renderer2.push(`<div class="flex-1 overflow-hidden"><div class="flex h-full flex-col"><div class="border-b border-quiet-border/60 px-4 py-1.5 text-[10px] font-medium uppercase tracking-wider text-quiet-faded">Preview</div> <div class="flex-1 overflow-y-auto p-6">`);
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
    if (store_get($$store_subs ??= {}, "$errorMessage", errorMessage)) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="fixed bottom-4 right-4 z-50 flex max-w-sm items-center gap-3 rounded-lg border border-quiet-danger/20 bg-quiet-danger-bg/95 px-4 py-3 shadow-sm backdrop-blur-sm transition-all duration-300 ease-in-out"><svg class="h-4 w-4 shrink-0 text-quiet-danger" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg> <div class="text-xs font-medium text-quiet-danger">${escape_html(store_get($$store_subs ??= {}, "$errorMessage", errorMessage))}</div></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></div> `);
    SettingsModal($$renderer2, { open: showSettings });
    $$renderer2.push(`<!---->`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
  });
}
export {
  _page as default
};
