import { a8 as ssr_context, k as attr_class, p as clsx, a9 as store_get, z as ensure_array_like, ad as unsubscribe_stores, l as attr_style, A as escape_html, aa as stringify, j as attr, w as derived, M as head } from "../../chunks/renderer.js";
import "clsx";
import { w as writable } from "../../chunks/index.js";
import "@tauri-apps/api/core";
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
        return `${base} bg-stone-200/70 text-stone-800 font-medium`;
      }
      return `${base} text-stone-500 hover:bg-stone-100 hover:text-stone-700`;
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
      $$renderer2.push(`<div class="px-3 py-2 text-xs text-stone-400">No folders</div>`);
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
        return `${base} bg-stone-200/70 text-stone-800 font-medium`;
      }
      return `${base} text-stone-500 hover:bg-stone-100 hover:text-stone-700`;
    }
    if (noteEntries.length === 0) {
      $$renderer2.push("<!--[1-->");
      $$renderer2.push(`<div class="px-3 py-2 text-xs text-stone-400">No notes</div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<div class="space-y-px"><!--[-->`);
      const each_array = ensure_array_like(noteEntries);
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let entry = each_array[$$index];
        $$renderer2.push(`<div class="group relative flex items-center"><button${attr_class(clsx(noteBtnClass(store_get($$store_subs ??= {}, "$currentNote", currentNote)?.path === entry.path)))}><svg class="h-3.5 w-3.5 shrink-0" viewBox="0 0 16 16" fill="currentColor"><path d="M2 1.75C2 .784 2.784 0 3.75 0h5.586c.464 0 .909.184 1.237.513l2.914 2.914c.329.328.513.773.513 1.237v9.586A1.75 1.75 0 0 1 12.25 16h-8.5A1.75 1.75 0 0 1 2 14.25V1.75Z"></path></svg> <span class="truncate pr-5">${escape_html(entry.name)}</span></button> <button class="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-stone-400 opacity-0 transition-all hover:bg-stone-200/80 hover:text-red-600 group-hover:opacity-100" title="Delete note"><svg class="h-3 w-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 4h10M5 4v10a1 1 0 001 1h4a1 1 0 001-1V4M6.5 4V2.5a.5.5 0 01.5-.5h2a.5.5 0 01.5.5V4" stroke-linecap="round" stroke-linejoin="round"></path></svg></button></div>`);
      }
      $$renderer2.push(`<!--]--></div>`);
    }
    $$renderer2.push(`<!--]-->`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
  });
}
function SearchBar($$renderer) {
  let query = "";
  $$renderer.push(`<div class="relative"><svg class="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-400" viewBox="0 0 16 16" fill="currentColor"><path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"></path></svg> <input type="text" placeholder="Search notes…"${attr("value", query)} class="w-full rounded-md border border-stone-200/80 bg-white/60 py-1.5 pl-9 pr-3 text-xs text-stone-700 placeholder-stone-400 outline-none transition-colors focus:border-stone-300 focus:bg-white focus:ring-1 focus:ring-stone-300/40"/></div>`);
}
function Sidebar($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    $$renderer2.push(`<aside class="flex w-64 shrink-0 flex-col border-r border-stone-200/80 bg-white/50"><div class="border-b border-stone-200/60 px-4 py-3"><h1 class="text-sm font-semibold tracking-tight text-stone-800">Quietness</h1> <p class="text-xs text-stone-400">A quiet place to write.</p></div> <div class="px-3 pt-3 pb-1">`);
    SearchBar($$renderer2);
    $$renderer2.push(`<!----></div> <div class="overflow-y-auto"><div class="px-2 pt-3 pb-1"><span class="px-1 text-[10px] font-medium uppercase tracking-wider text-stone-400">Folders</span></div> `);
    FolderTree($$renderer2);
    $$renderer2.push(`<!----> <div class="mt-4 px-2 pt-3 pb-1 flex items-center justify-between border-t border-stone-200/60"><span class="px-1 text-[10px] font-medium uppercase tracking-wider text-stone-400">Notes</span> <button class="rounded px-1.5 py-0.5 text-xs text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600">+ New</button></div> `);
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    NoteList($$renderer2);
    $$renderer2.push(`<!----></div></aside>`);
  });
}
function NoteEditor($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
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
    $$renderer2.push(`<div class="prose prose-stone max-w-none" role="region">${html(renderMarkdown(content, existingNoteNames()))}</div>`);
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
      $$renderer2.push(`<div class="flex items-center justify-between border-b border-stone-200/60 px-6 py-3"><h2 class="text-sm font-medium text-stone-700">${escape_html(store_get($$store_subs ??= {}, "$currentNote", currentNote).name)}</h2> <div class="flex items-center gap-2"><div class="flex overflow-hidden rounded-md border border-stone-200/60"><!--[-->`);
      const each_array = ensure_array_like(modes);
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let mode = each_array[$$index];
        $$renderer2.push(`<button${attr_class(`px-3 py-1 text-xs transition-colors ${store_get($$store_subs ??= {}, "$viewMode", viewMode) === mode.value ? "bg-stone-800 text-stone-100" : "text-stone-500 hover:bg-stone-100 hover:text-stone-700"}`)}>${escape_html(mode.label)}</button>`);
      }
      $$renderer2.push(`<!--]--></div> <button class="rounded-md px-3 py-1 text-xs text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-700">Save</button> <button${attr("disabled", isDeleting, true)} class="rounded-md px-3 py-1 text-xs text-red-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50">Delete</button></div></div> <div class="flex flex-1">`);
      if (store_get($$store_subs ??= {}, "$viewMode", viewMode) === "edit" || store_get($$store_subs ??= {}, "$viewMode", viewMode) === "split") {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<div${attr_class(`${store_get($$store_subs ??= {}, "$viewMode", viewMode) === "split" ? "flex-1 border-r border-stone-200/60" : "flex-1"} overflow-hidden`)}><div class="flex h-full flex-col"><div class="border-b border-stone-200/60 px-4 py-1.5 text-[10px] font-medium uppercase tracking-wider text-stone-400">Editor</div> <div class="flex-1">`);
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
        $$renderer2.push(`<div class="flex-1 overflow-hidden"><div class="flex h-full flex-col"><div class="border-b border-stone-200/60 px-4 py-1.5 text-[10px] font-medium uppercase tracking-wider text-stone-400">Preview</div> <div class="flex-1 overflow-y-auto p-6">`);
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
      $$renderer2.push(`<div class="flex flex-1 items-center justify-center"><div class="text-center"><h2 class="text-xl font-semibold tracking-tight text-stone-700">Welcome to Quietness</h2> <p class="mt-2 text-sm text-stone-400">Select a note from the sidebar to start writing.</p></div></div>`);
    }
    $$renderer2.push(`<!--]--></main></div> `);
    if (store_get($$store_subs ??= {}, "$errorMessage", errorMessage)) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="fixed bottom-4 right-4 z-50 flex max-w-sm items-center gap-3 rounded-lg border border-red-200 bg-red-50/95 px-4 py-3 shadow-md backdrop-blur-sm transition-all duration-300 ease-in-out"><svg class="h-4 w-4 shrink-0 text-red-500" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg> <div class="text-xs font-medium text-red-700">${escape_html(store_get($$store_subs ??= {}, "$errorMessage", errorMessage))}</div></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]-->`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
  });
}
export {
  _page as default
};
