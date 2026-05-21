

export const index = 0;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_layout.svelte.js')).default;
export const universal = {
  "ssr": false
};
export const universal_id = "src/routes/+layout.ts";
export const imports = ["_app/immutable/nodes/0.DE2MI-yJ.js","_app/immutable/chunks/C0a9WZBX.js","_app/immutable/chunks/DX35xQca.js","_app/immutable/chunks/CYT0eCsN.js"];
export const stylesheets = ["_app/immutable/assets/0.DhRSG1Vv.css"];
export const fonts = [];
