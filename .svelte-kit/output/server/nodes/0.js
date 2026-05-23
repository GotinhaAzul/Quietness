

export const index = 0;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_layout.svelte.js')).default;
export const universal = {
  "ssr": false
};
export const universal_id = "src/routes/+layout.ts";
export const imports = ["_app/immutable/nodes/0.B5e5g9Dd.js","_app/immutable/chunks/D4lmisT5.js","_app/immutable/chunks/Cr9YwSiM.js","_app/immutable/chunks/Chgk84r5.js"];
export const stylesheets = ["_app/immutable/assets/0.Cvdi5GDN.css"];
export const fonts = [];
