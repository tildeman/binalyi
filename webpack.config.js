const path = require("path");
module.exports = {
	entry : "./index.js",
	module: {
		rules: [
			{ test: /\.ts$/, use: 'ts-loader' },
		],
	},
	resolve: {
		// Add `.ts` and `.tsx` as a resolvable extension.
		extensions: [".ts", ".tsx", ".js"],
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
