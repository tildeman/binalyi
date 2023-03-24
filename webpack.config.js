const path = require("path");
module.exports = {
	entry : "./index.js",
	module: {
		rules: [
			{ test: /\.ts$/, use: 'ts-loader' },
		],
	},
	output : {
		filename: "fblockly.js",
		library: "FBlockly",
		path : path.resolve(__dirname,"out")
	},
	mode : "development"
}
