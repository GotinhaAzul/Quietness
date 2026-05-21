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
		client: {start:"_app/immutable/entry/start.CMmguu24.js",app:"_app/immutable/entry/app.DdcY90eX.js",imports:["_app/immutable/entry/start.CMmguu24.js","_app/immutable/chunks/DBey8l5c.js","_app/immutable/chunks/DX35xQca.js","_app/immutable/chunks/CtxV-lzx.js","_app/immutable/entry/app.DdcY90eX.js","_app/immutable/chunks/DX35xQca.js","_app/immutable/chunks/DSbm1w9f.js","_app/immutable/chunks/C0a9WZBX.js","_app/immutable/chunks/CtxV-lzx.js","_app/immutable/chunks/CYT0eCsN.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
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
