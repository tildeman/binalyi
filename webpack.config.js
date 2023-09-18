const path = require("path");
module.exports = {
	entry : "./index.ts",
	module: {
		rules: [
			{
				test: /\.[jt]sx?$/,
				loader: "esbuild-loader",
				options: {
					target: "es2018"
				}
			},
		],
	},
	resolve: {
		// Add `.ts` and `.tsx` as a resolvable extension.
		extensions: [".ts", ".tsx", ".js", ".jsx"],
		// Add support for TypeScripts fully qualified ESM imports.
		extensionAlias: {
			".js": [".js", ".ts"],
			".cjs": [".cjs", ".cts"],
			".mjs": [".mjs", ".mts"]
		}
	},
	output : {
		filename: "fblockly.js",
		library: "FBlockly",
		path : path.resolve(__dirname,"out")
	},
	mode : "development"
}
