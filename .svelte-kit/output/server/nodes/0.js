

export const index = 0;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_layout.svelte.js')).default;
export const universal = {
  "ssr": false
};
export const universal_id = "src/routes/+layout.ts";
export const imports = ["_app/immutable/nodes/0.CwGUuQO9.js","_app/immutable/chunks/BhgKY_Kl.js","_app/immutable/chunks/oGQ_EPEd.js","_app/immutable/chunks/DQ2m3ILI.js"];
export const stylesheets = ["_app/immutable/assets/0.Cvdi5GDN.css"];
export const fonts = [];
