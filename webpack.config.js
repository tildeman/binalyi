import * as path from "node:path";
import { fileURLToPath } from "node:url";

export default {
	entry : './index.ts',
	module: {
		rules: [
			{
				test: /\.ts$/,
				use: 'ts-loader'
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
		path : path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'out')
	},
	mode : 'development'
}
