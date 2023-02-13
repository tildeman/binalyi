const path = require("path");
module.exports = {
	entry : "./index.js",
	output : {
		filename: "fblockly.js",
		library: "FBlockly",
		path : path.resolve(__dirname,"out")
	},
	mode : "development"
}
