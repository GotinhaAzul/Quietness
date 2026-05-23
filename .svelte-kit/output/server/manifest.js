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
		client: {start:"_app/immutable/entry/start.Cim9qiIm.js",app:"_app/immutable/entry/app.DgLVLz7_.js",imports:["_app/immutable/entry/start.Cim9qiIm.js","_app/immutable/chunks/QB6Zb9vK.js","_app/immutable/chunks/oGQ_EPEd.js","_app/immutable/chunks/3tiVPsDc.js","_app/immutable/entry/app.DgLVLz7_.js","_app/immutable/chunks/oGQ_EPEd.js","_app/immutable/chunks/CLgwOgDd.js","_app/immutable/chunks/BhgKY_Kl.js","_app/immutable/chunks/3tiVPsDc.js","_app/immutable/chunks/BQ1QSzyH.js","_app/immutable/chunks/DQ2m3ILI.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
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
