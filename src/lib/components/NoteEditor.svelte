<script lang="ts">
  import { EditorView, basicSetup } from 'codemirror';
  import { Compartment, EditorState } from '@codemirror/state';
  import { markdown } from '@codemirror/lang-markdown';
  import { onMount } from 'svelte';
  import { settings } from '$lib/stores/settings';
  import { currentNote, notes, showError } from '$lib/stores/notes';
  import { invoke } from '@tauri-apps/api/core';

  let { content = '', onContentChange }: { content?: string; onContentChange?: (value: string) => void } = $props();

  let editorRef: HTMLDivElement;
  let view: EditorView;
  let ignoreContentUpdate = false;
  let titleEditing = $state(false);
  let titleValue = $state('');

  const guttersComp = new Compartment();
  const wordWrapComp = new Compartment();
  const tabSizeComp = new Compartment();

  const noteStates = new Map<string, EditorState>();
  let prevPath = '';

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
    '&.cm-focused .cm-selectionLayer .cm-selectionBackground, .cm-selectionLayer .cm-selectionBackground': {
      backgroundColor: 'var(--q-accent) !important',
      opacity: '0.2',
    },
    '.cm-cursor': {
      borderLeftColor: 'var(--q-accent)',
    },
    '&.cm-focused': {
      outline: 'none',
    },
  });

  let editorCfg = $derived({
    lineNumbers: $settings.editor.lineNumbers,
    wordWrap: $settings.editor.wordWrap,
    tabSize: $settings.editor.tabSize,
  });

  let noteName = $derived($currentNote?.name ?? '');

  function getGuttersExt(show: boolean) {
    return show
      ? []
      : EditorView.theme({ '.cm-gutters': { display: 'none' } });
  }

  onMount(() => {
    const s = $settings;
    view = new EditorView({
      doc: content,
      extensions: [
        basicSetup,
        quietThemeExt,
        guttersComp.of(getGuttersExt(s.editor.lineNumbers)),
        wordWrapComp.of(s.editor.wordWrap ? EditorView.lineWrapping : []),
        tabSizeComp.of(EditorState.tabSize.of(s.editor.tabSize)),
        markdown(),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            ignoreContentUpdate = true;
            onContentChange?.(update.state.doc.toString());
          }
        }),
      ],
      parent: editorRef,
    });

    return () => {
      view.destroy();
    };
  });

  $effect(() => {
    if (!view) return;
    const cfg = editorCfg;
    view.dispatch({
      effects: [
        guttersComp.reconfigure(getGuttersExt(cfg.lineNumbers)),
        wordWrapComp.reconfigure(cfg.wordWrap ? EditorView.lineWrapping : []),
        tabSizeComp.reconfigure(EditorState.tabSize.of(cfg.tabSize)),
      ],
    });
  });

  $effect(() => {
    if (!view) {
      ignoreContentUpdate = false;
      return;
    }
    const note = $currentNote;
    const newPath = note?.path ?? '';

    if (prevPath && prevPath !== newPath) {
      noteStates.set(prevPath, view.state);
    }

    if (prevPath !== newPath) {
      prevPath = newPath;
      ignoreContentUpdate = false;
      const saved = noteStates.get(newPath);
      if (saved) {
        view.setState(saved);
        const cfg = editorCfg;
        view.dispatch({
          effects: [
            guttersComp.reconfigure(getGuttersExt(cfg.lineNumbers)),
            wordWrapComp.reconfigure(cfg.wordWrap ? EditorView.lineWrapping : []),
            tabSizeComp.reconfigure(EditorState.tabSize.of(cfg.tabSize)),
          ],
        });
        return;
      }
      const newContent = note?.content ?? '';
      if (newContent) {
        view.dispatch({
          changes: { from: 0, to: view.state.doc.length, insert: newContent },
        });
      }
      return;
    }

    if (ignoreContentUpdate) {
      ignoreContentUpdate = false;
      return;
    }
    const newContent = note?.content ?? '';
    if (newContent && newContent !== view.state.doc.toString()) {
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: newContent },
      });
    }
  });

  function startEditing() {
    titleValue = noteName;
    titleEditing = true;
  }

  async function saveTitle() {
    titleEditing = false;
    const trimmed = titleValue.trim();
    if (!trimmed || trimmed === noteName) return;
    const note = $currentNote;
    if (!note) return;
    try {
      await invoke('rename_note', { oldPath: note.path, newName: trimmed });
      const newPath = note.path.replace(/[^/\\]+$/, trimmed + '.md');
      currentNote.update(n => n ? { ...n, name: trimmed, path: newPath } : n);
      notes.update(list => list.map(n => n.path === note.path ? { ...n, name: trimmed, path: newPath } : n));
    } catch (e) {
      showError(`Failed to rename note: ${e}`);
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

<div class="flex flex-col h-full w-full">
  {#if $currentNote}
    <div class="title-bar">
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
  {/if}
  <div bind:this={editorRef} class="flex-1 min-h-0"></div>
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
</style>
