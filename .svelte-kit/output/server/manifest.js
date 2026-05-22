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
		client: {start:"_app/immutable/entry/start.WV8qgxTU.js",app:"_app/immutable/entry/app.BfqSI-Zx.js",imports:["_app/immutable/entry/start.WV8qgxTU.js","_app/immutable/chunks/C7SrLU4F.js","_app/immutable/chunks/cchjwY-b.js","_app/immutable/chunks/DCU2JIW8.js","_app/immutable/entry/app.BfqSI-Zx.js","_app/immutable/chunks/cchjwY-b.js","_app/immutable/chunks/C2ApWLmP.js","_app/immutable/chunks/Ku2_QlfN.js","_app/immutable/chunks/DCU2JIW8.js","_app/immutable/chunks/JzvGenMJ.js","_app/immutable/chunks/BsRMeEU-.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
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
