

export const index = 0;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_layout.svelte.js')).default;
export const universal = {
  "ssr": false
};
export const universal_id = "src/routes/+layout.ts";
export const imports = ["_app/immutable/nodes/0.JZraxcPx.js","_app/immutable/chunks/PtjZ8iyJ.js","_app/immutable/chunks/Cb20woAz.js","_app/immutable/chunks/CuicYwqw.js"];
export const stylesheets = ["_app/immutable/assets/0.Bn-O0dFu.css"];
export const fonts = [];
