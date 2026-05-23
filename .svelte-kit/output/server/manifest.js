export const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set([]),
	mimeTypes: {},
	_: {
		client: {start:"_app/immutable/entry/start.DsuQFpoE.js",app:"_app/immutable/entry/app.Cb5_hDxp.js",imports:["_app/immutable/entry/start.DsuQFpoE.js","_app/immutable/chunks/BRIE7dpg.js","_app/immutable/chunks/Cr9YwSiM.js","_app/immutable/chunks/PYP0Yq3l.js","_app/immutable/entry/app.Cb5_hDxp.js","_app/immutable/chunks/Cr9YwSiM.js","_app/immutable/chunks/CY4ntqis.js","_app/immutable/chunks/D4lmisT5.js","_app/immutable/chunks/PYP0Yq3l.js","_app/immutable/chunks/DkYAs94b.js","_app/immutable/chunks/Chgk84r5.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('./nodes/0.js')),
			__memo(() => import('./nodes/1.js')),
			__memo(() => import('./nodes/2.js'))
		],
		remotes: {
			
		},
		routes: [
			{
				id: "/",
				pattern: /^\/$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 2 },
				endpoint: null
			}
		],
		prerendered_routes: new Set([]),
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})();
