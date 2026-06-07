<script lang="ts">
  import { EditorView } from 'codemirror';
  import { Compartment, EditorState } from '@codemirror/state';
  import { markdown } from '@codemirror/lang-markdown';
  import {
    lineNumbers,
    highlightActiveLineGutter,
    highlightSpecialChars,
    drawSelection,
    rectangularSelection,
    highlightActiveLine,
    keymap,
  } from '@codemirror/view';
  import { indentOnInput, syntaxHighlighting, defaultHighlightStyle, bracketMatching } from '@codemirror/language';
  import { history, defaultKeymap, historyKeymap, indentWithTab } from '@codemirror/commands';
  import { closeBrackets } from '@codemirror/autocomplete';
  import { onMount } from 'svelte';
  import { settings } from '$lib/stores/settings';
  import { currentNote, notes, bumpNotesRevision } from '$lib/stores/notes';
  import { showError } from '$lib/stores/errors';
  import { editorInsert } from '$lib/stores/editor';
  import { invoke } from '@tauri-apps/api/core';
  import { buildRenamedNotePath, resolveRenameRequest } from '$lib/utils/noteRename';
  import { petCursorCoords, petLastTypingTime } from '$lib/stores/pet';
  import { createPerfTimer, incrementCounter, logNoteStatesSize } from '$lib/utils/perf';

  function getSingleDiff(oldStr: string, newStr: string) {
    if (oldStr === newStr) return null;
    if (oldStr.length !== newStr.length) return null;

    let firstDiff = -1;
    let lastDiff = -1;
    for (let i = 0; i < oldStr.length; i++) {
      if (oldStr[i] !== newStr[i]) {
        if (firstDiff === -1) firstDiff = i;
        lastDiff = i;
      }
    }

    if (firstDiff !== -1 && lastDiff === firstDiff) {
      return {
        from: firstDiff,
        to: firstDiff + 1,
        insert: newStr[firstDiff],
      };
    }
    return null;
  }

  let { content = '', onContentChange }: { content?: string; onContentChange?: (value: string) => void } = $props();

  let editorRef: HTMLDivElement;
  let view: EditorView;
  let ignoreContentUpdate = false;
  let titleEditing = $state(false);
  let titleValue = $state('');
  let titleRenamePending = $state(false);

  const guttersComp = new Compartment();
  const wordWrapComp = new Compartment();
  const tabSizeComp = new Compartment();
  const dimInactiveComp = new Compartment();
  const smoothCaretComp = new Compartment();

  const LRU_MAX = 15;
  const noteStates = new Map<string, EditorState>();
  let prevPath = '';

  function touchNoteState(path: string, state: EditorState) {
    if (noteStates.has(path)) {
      noteStates.delete(path);
    }
    noteStates.set(path, state);
  }

  function trimNoteStates() {
    if (noteStates.size <= LRU_MAX) return;
    const excess = noteStates.size - LRU_MAX;
    const keys = [...noteStates.keys()];
    for (let i = 0; i < excess; i++) {
      noteStates.delete(keys[i]);
    }
  }

  $effect(() => {
    const currentPaths = new Set($notes.map(n => n.path));
    const current = $currentNote?.path;
    for (const path of noteStates.keys()) {
      if (path !== current && !currentPaths.has(path)) {
        noteStates.delete(path);
      }
    }
  });

  const quietThemeExt = EditorView.theme({
    '&': {
      backgroundColor: 'var(--q-bg)',
      color: 'var(--q-text)',
    },
    '.cm-gutters': {
      backgroundColor: 'var(--q-surface)',
      borderRight: '1px solid var(--q-border)',
      color: 'var(--q-faded)',
    },
    '.cm-activeLineGutter': {
      backgroundColor: 'var(--q-hover)',
    },
    '.cm-activeLine': {
      backgroundColor: 'var(--q-hover)',
    },
    '.cm-selectionBackground': {
      backgroundColor: 'var(--q-selection-bg-inactive) !important',
    },
    '&.cm-focused .cm-selectionBackground': {
      backgroundColor: 'var(--q-selection-bg) !important',
    },
    '.cm-content ::selection': {
      backgroundColor: 'var(--q-selection-bg)',
    },
    '.cm-line::selection, .cm-line ::selection': {
      backgroundColor: 'var(--q-selection-bg)',
    },
    '.cm-cursor': {
      borderLeftColor: 'var(--q-accent)',
    },
    '&.cm-focused': {
      outline: 'none',
    },
  });

  function dimInactiveExt() {
    return EditorView.theme({
      '.cm-line:not(.cm-activeLine)': {
        opacity: '0.4',
        transition: 'opacity 0.15s ease',
      },
    });
  }

  function smoothCaretExt() {
    return EditorView.theme({
      '.cm-cursor': {
        transition: 'left 0.12s cubic-bezier(0.34, 1.56, 0.64, 1), top 0.12s cubic-bezier(0.34, 1.56, 0.64, 1) !important',
      },
    });
  }

  const backtickAutoClose = keymap.of([{
    key: '`',
    run: (view) => {
      const { state } = view;
      const pos = state.selection.main.head;
      const charAt = state.sliceDoc(pos, pos + 1);
      if (charAt === '`') {
        view.dispatch({
          changes: { from: pos, to: pos + 1 },
          selection: { anchor: pos + 1, head: pos + 1 },
        });
        return true;
      }
      view.dispatch({
        changes: { from: pos, insert: '``' },
        selection: { anchor: pos + 1, head: pos + 1 },
      });
      return true;
    },
  }]);

  let editorCfg = $derived({
    lineNumbers: $settings.editor.lineNumbers,
    wordWrap: $settings.editor.wordWrap,
    tabSize: $settings.editor.tabSize,
    dimInactiveLines: $settings.editor.dimInactiveLines,
    smoothCaret: $settings.editor.smoothCaret,
  });

  let lastCfg: typeof editorCfg | null = null;

  let noteName = $derived($currentNote?.name ?? '');

  let wordCount = $state(0);
  let wordCountTimer: ReturnType<typeof setTimeout> | undefined;
  let charCount = $derived(content ? content.length : 0);

  $effect(() => {
    const src = content;
    clearTimeout(wordCountTimer);
    wordCountTimer = setTimeout(() => {
      wordCount = src
        ? src.trim() === ''
          ? 0
          : src.trim().split(/\s+/).length
        : 0;
    }, 200);
    return () => clearTimeout(wordCountTimer);
  });

  function getGuttersExt(show: boolean) {
    return show
      ? []
      : EditorView.theme({ '.cm-gutters': { display: 'none' } });
  }

  onMount(() => {
    const timer = createPerfTimer('editor-mount');
    const s = $settings;
    view = new EditorView({
      doc: content,
      extensions: [
        lineNumbers(),
        highlightActiveLineGutter(),
        highlightSpecialChars(),
        history(),
        drawSelection(),
        EditorState.allowMultipleSelections.of(true),
        indentOnInput(),
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        bracketMatching(),
        rectangularSelection(),
        highlightActiveLine(),
        quietThemeExt,
        guttersComp.of(getGuttersExt(s.editor.lineNumbers)),
        wordWrapComp.of(s.editor.wordWrap ? EditorView.lineWrapping : []),
        tabSizeComp.of(EditorState.tabSize.of(s.editor.tabSize)),
        dimInactiveComp.of(s.editor.dimInactiveLines ? dimInactiveExt() : []),
        smoothCaretComp.of(s.editor.smoothCaret ? smoothCaretExt() : []),
        closeBrackets(),
        backtickAutoClose,
        keymap.of([indentWithTab, ...defaultKeymap, ...historyKeymap]),
        markdown(),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            ignoreContentUpdate = true;
            onContentChange?.(update.state.doc.toString());

            const sel = update.state.selection.main;
            const pos = sel.head;
            const coords = update.view.coordsAtPos(pos);
            if (coords) {
              petCursorCoords.set({ x: coords.left, y: coords.top });
              petLastTypingTime.set(performance.now());
            }
          }
        }),
      ],
      parent: editorRef,
    });
    timer.end();

    editorInsert.set((content: string) => {
      if (!view) return;
      view.dispatch({
        changes: { from: view.state.selection.main.head, insert: content },
      });
      onContentChange?.(view.state.doc.toString());
    });

    return () => {
      editorInsert.set(null);
      view.destroy();
    };
  });

  $effect(() => {
    if (!view) return;
    const cfg = editorCfg;
    const prev = lastCfg;
    lastCfg = { ...cfg };

    const effects: Array<any> = [];
    if (!prev || cfg.lineNumbers !== prev.lineNumbers) {
      effects.push(guttersComp.reconfigure(getGuttersExt(cfg.lineNumbers)));
    }
    if (!prev || cfg.wordWrap !== prev.wordWrap) {
      effects.push(wordWrapComp.reconfigure(cfg.wordWrap ? EditorView.lineWrapping : []));
    }
    if (!prev || cfg.tabSize !== prev.tabSize) {
      effects.push(tabSizeComp.reconfigure(EditorState.tabSize.of(cfg.tabSize)));
    }
    if (!prev || cfg.dimInactiveLines !== prev.dimInactiveLines) {
      effects.push(dimInactiveComp.reconfigure(cfg.dimInactiveLines ? dimInactiveExt() : []));
    }
    if (!prev || cfg.smoothCaret !== prev.smoothCaret) {
      effects.push(smoothCaretComp.reconfigure(cfg.smoothCaret ? smoothCaretExt() : []));
    }
    incrementCounter('compartment-reconfigure');
    if (effects.length > 0) {
      view.dispatch({ effects });
    }
  });

  $effect(() => {
    if (!view) {
      ignoreContentUpdate = false;
      return;
    }
    const note = $currentNote;
    const newPath = note?.path ?? '';

    if (prevPath && prevPath !== newPath) {
      touchNoteState(prevPath, view.state);
      trimNoteStates();
    }

    if (prevPath !== newPath) {
      const hotTimer = createPerfTimer('hot-path-note-switch');
      prevPath = newPath;
      ignoreContentUpdate = false;
      const newContent = note?.content ?? '';
      const saved = noteStates.get(newPath);
      logNoteStatesSize(noteStates.size);
      if (saved && saved.doc.toString() === newContent) {
        view.setState(saved);
        hotTimer.end('restore-state');
        return;
      }
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: newContent },
      });
      hotTimer.end('dispatch-content');
      return;
    }

    if (ignoreContentUpdate) {
      ignoreContentUpdate = false;
      return;
    }
    const newContent = note?.content ?? '';
    const oldContent = view.state.doc.toString();
    if (newContent !== oldContent) {
      const diff = getSingleDiff(oldContent, newContent);
      if (diff) {
        view.dispatch({
          changes: { from: diff.from, to: diff.to, insert: diff.insert },
        });
      } else {
        view.dispatch({
          changes: { from: 0, to: oldContent.length, insert: newContent },
        });
      }
    }
  });

  function startEditing() {
    titleValue = noteName;
    titleEditing = true;
  }

  async function saveTitle() {
    const note = $currentNote;
    if (!note) return;
    const cleanName = resolveRenameRequest({
      currentName: note.name,
      requestedName: titleValue,
      isSubmitting: titleRenamePending,
    });
    if (!cleanName) {
      if (!titleRenamePending) {
        titleEditing = false;
      }
      return;
    }

    titleRenamePending = true;
    titleEditing = false;
    try {
      await invoke('rename_note', { oldPath: note.path, newName: cleanName });
      const newPath = buildRenamedNotePath(note.path, cleanName);
      const savedState = noteStates.get(note.path);
      if (savedState) {
        noteStates.delete(note.path);
        noteStates.set(newPath, savedState);
      }
      currentNote.update(n => n ? { ...n, name: cleanName, path: newPath } : n);
      notes.update(list => list.map(n => n.path === note.path ? { ...n, name: cleanName, path: newPath } : n));
      bumpNotesRevision();
    } catch (e) {
      showError(`Failed to rename note: ${e}`);
    } finally {
      titleRenamePending = false;
    }
  }

  function handleTitleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveTitle();
    }
    if (e.key === 'Escape') {
      titleEditing = false;
    }
  }

  function focusOnMount(node: HTMLInputElement) {
    node.focus();
  }
</script>

<div class="flex h-full min-h-0 w-full flex-col">
  {#if $currentNote}
    <div class="title-bar">
      <div class="flex-1 min-w-0">
        {#if titleEditing}
          <input
            type="text"
            class="title-input"
            bind:value={titleValue}
            onblur={saveTitle}
            onkeydown={handleTitleKeydown}
            use:focusOnMount
          />
        {:else}
          <button class="title-button" onclick={startEditing}>{noteName}</button>
        {/if}
      </div>
    </div>
  {/if}
  <div bind:this={editorRef} class="min-h-0 flex-1 overflow-hidden"></div>
  {#if $currentNote}
    <div class="word-count">{wordCount} words · {charCount} characters</div>
  {/if}
</div>

<style>
  .title-bar {
    display: flex;
    align-items: center;
    padding: 8px 16px;
    border-bottom: 1px solid var(--q-border);
    background: var(--q-surface);
    flex-shrink: 0;
  }
  .title-button {
    font-size: 13px;
    font-weight: 600;
    color: var(--q-text);
    background: none;
    border: none;
    padding: 2px 6px;
    border-radius: 4px;
    cursor: pointer;
    transition: background 0.15s;
    line-height: 1.4;
    width: 100%;
    text-align: left;
  }
  .title-button:hover {
    background: var(--q-hover);
  }
  .title-input {
    font-size: 13px;
    font-weight: 600;
    color: var(--q-text);
    background: var(--q-bg);
    border: 1px solid var(--q-accent);
    padding: 2px 6px;
    border-radius: 4px;
    outline: none;
    line-height: 1.4;
    width: 100%;
    max-width: 400px;
  }
  .word-count {
    flex-shrink: 0;
    padding: 4px 16px;
    font-size: 11px;
    color: var(--q-faded);
    border-top: 1px solid var(--q-border);
    text-align: right;
    user-select: none;
  }
  :global(.cm-editor) {
    height: 100%;
  }
  :global(.cm-scroller) {
    overflow: auto;
  }
</style>
