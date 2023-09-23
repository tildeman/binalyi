const path = require('path');
const DeclarationBundlerPlugin = require('types-webpack-bundler');

module.exports = {
	entry : './index.ts',
	module: {
		rules: [
			{
				test: /\.ts$/,
				use: 'ts-loader'
			},
			{
				test: /\.js$/,
				loader: 'babel-loader',
				options: {
					targets: '>0.3% and not dead'
				}
			}
		],
	},
	resolve: {
		// Add `.ts` and `.tsx` as a resolvable extension.
		extensions: ['.ts', '.tsx', '.js', '.jsx'],
		// Add support for TypeScripts fully qualified ESM imports.
		extensionAlias: {
			'.js': ['.js', '.ts'],
			'.cjs': ['.cjs', '.cts'],
			'.mjs': ['.mjs', '.mts']
		}
	},
	output : {
		filename: 'fblockly.js',
		library: 'FBlockly',
		path : path.resolve(__dirname,'out')
	},
	mode : 'development',
	// plugins: [
	// 	new DeclarationBundlerPlugin({
	// 		moduleName: 'FBlockly',
	// 		out: './out/fblockly.d.ts',
	// 	})
	// ]
}
