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
		client: {start:"_app/immutable/entry/start.3j2CV4s9.js",app:"_app/immutable/entry/app.DtdL53Ku.js",imports:["_app/immutable/entry/start.3j2CV4s9.js","_app/immutable/chunks/CjNoYrBe.js","_app/immutable/chunks/Cb20woAz.js","_app/immutable/chunks/DTDKYq1K.js","_app/immutable/entry/app.DtdL53Ku.js","_app/immutable/chunks/Cb20woAz.js","_app/immutable/chunks/BK7WcOnN.js","_app/immutable/chunks/PtjZ8iyJ.js","_app/immutable/chunks/DTDKYq1K.js","_app/immutable/chunks/Ctj_PjlL.js","_app/immutable/chunks/CuicYwqw.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
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
