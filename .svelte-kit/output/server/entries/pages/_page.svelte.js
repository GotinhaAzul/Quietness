import { V as head } from "../../chunks/renderer.js";
function _page($$renderer) {
  head("1uha8ag", $$renderer, ($$renderer2) => {
    $$renderer2.title(($$renderer3) => {
      $$renderer3.push(`<title>Quietness</title>`);
    });
    $$renderer2.push(`<meta name="description" content="Offline note taking app with a calm, minimal writing surface."/>`);
  });
  $$renderer.push(`<section class="flex min-h-screen items-center justify-center px-6 py-16"><div class="w-full max-w-3xl rounded-[2rem] border border-black/5 bg-white/70 p-10 shadow-[0_24px_80px_rgba(76,58,37,0.12)] backdrop-blur"><div class="mb-8 inline-flex rounded-full border border-emerald-900/10 bg-emerald-900/5 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-emerald-950/70">T01 Scaffold Ready</div> <h1 class="max-w-2xl text-4xl font-semibold tracking-tight text-stone-900 sm:text-5xl">Quietness starts with a quiet surface.</h1> <p class="mt-5 max-w-2xl text-base leading-7 text-stone-700 sm:text-lg">SvelteKit, Tauri and Tailwind are wired together so the desktop shell can open directly into a minimal starter view.</p> <div class="mt-10 grid gap-4 sm:grid-cols-3"><div class="rounded-2xl border border-stone-200/80 bg-stone-50/80 p-4"><p class="text-sm font-medium text-stone-900">Frontend</p> <p class="mt-2 text-sm text-stone-600">SvelteKit on Vite with static adapter.</p></div> <div class="rounded-2xl border border-stone-200/80 bg-stone-50/80 p-4"><p class="text-sm font-medium text-stone-900">Desktop</p> <p class="mt-2 text-sm text-stone-600">Tauri configured to launch the local dev server.</p></div> <div class="rounded-2xl border border-stone-200/80 bg-stone-50/80 p-4"><p class="text-sm font-medium text-stone-900">Styling</p> <p class="mt-2 text-sm text-stone-600">Tailwind enabled and visible in the default screen.</p></div></div></div></section>`);
}
export {
  _page as default
};
