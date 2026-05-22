<script lang="ts">
  import { EditorView, basicSetup } from 'codemirror';
  import { Compartment, EditorState } from '@codemirror/state';
  import { markdown } from '@codemirror/lang-markdown';
  import { onMount } from 'svelte';
  import { settings } from '$lib/stores/settings';

  let { content = '', onContentChange }: { content?: string; onContentChange?: (value: string) => void } = $props();

  let editorRef: HTMLDivElement;
  let view: EditorView;
  let ignoreContentUpdate = false;

  const guttersComp = new Compartment();
  const wordWrapComp = new Compartment();
  const tabSizeComp = new Compartment();

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
    const s = $settings;
    view.dispatch({
      effects: [
        guttersComp.reconfigure(getGuttersExt(s.editor.lineNumbers)),
        wordWrapComp.reconfigure(s.editor.wordWrap ? EditorView.lineWrapping : []),
        tabSizeComp.reconfigure(EditorState.tabSize.of(s.editor.tabSize)),
      ],
    });
  });

  $effect(() => {
    if (!view || ignoreContentUpdate) {
      ignoreContentUpdate = false;
      return;
    }
    if (content !== view.state.doc.toString()) {
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: content },
      });
    }
  });
</script>

<div bind:this={editorRef} class="h-full w-full"></div>
