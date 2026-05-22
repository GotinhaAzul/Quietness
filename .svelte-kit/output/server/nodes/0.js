

export const index = 0;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_layout.svelte.js')).default;
export const universal = {
  "ssr": false
};
export const universal_id = "src/routes/+layout.ts";
export const imports = ["_app/immutable/nodes/0.D8vgqsAv.js","_app/immutable/chunks/Ku2_QlfN.js","_app/immutable/chunks/cchjwY-b.js","_app/immutable/chunks/BsRMeEU-.js"];
export const stylesheets = ["_app/immutable/assets/0.C2drnmjV.css"];
export const fonts = [];
