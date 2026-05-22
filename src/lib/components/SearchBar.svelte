<script lang="ts">
  let query = $state('');
</script>

<div class="relative">
  <svg class="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-400" viewBox="0 0 16 16" fill="currentColor">
    <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
  </svg>
  <input
    type="text"
    placeholder="Search notes…"
    bind:value={query}
    class="w-full rounded-md border border-stone-200/80 bg-white/60 py-1.5 pl-9 pr-3 text-xs text-stone-700 placeholder-stone-400 outline-none transition-colors focus:border-stone-300 focus:bg-white focus:ring-1 focus:ring-stone-300/40"
  />
</div>
