<script lang="ts">
  import '../app.css';
  import '$lib/themes/quiet-light.css';
  import '$lib/themes/quiet-dark.css';
  import '$lib/themes/catppuccin-latte.css';
  import '$lib/themes/catppuccin-mocha.css';
  import '$lib/themes/everforest-day.css';
  import '$lib/themes/everforest-night.css';
  import '$lib/themes/github-light.css';
  import '$lib/themes/github-dark.css';
  import '$lib/themes/nord.css';

  const { children } = $props();
</script>

{@render children()}
