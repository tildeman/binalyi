import * as Blockly from "blockly"
import { TypeWorkspace } from "../categories/types"

/**
 * Class for a database of entity names (variables, types, etc).
 */
export class FNames extends Blockly.Names {
	// Blockly made a lame decision to make all those important variables private
	// Now I have to reimplement almost everything. What a hassle.
	protected readonly wariablePrefix: string;
	protected readonly reserwedWords: Set<string>;
	protected wariableMap: Blockly.VariableMap | null;
	protected bd = new Map<string, Map<string, string>>();
	protected bdRewerse = new Set<string>();

	/**
	 * @param reservedWordsList A comma-separated string of words that are illegal
	 *     for use as names in a language (e.g. 'new,if,this,...').
	 * @param opt_variablePrefix Some languages need a '$' or a namespace before
	 *     all variable names (but not procedure names).
	 */
	constructor(reservedWordsList: string, opt_variablePrefix?: string) {
		super(reservedWordsList, opt_variablePrefix);
		/** The prefix to attach to variable names in generated code. */
		this.wariablePrefix = opt_variablePrefix || '';

		this.reserwedWords = new Set<string>(
			reservedWordsList ? reservedWordsList.split(',') : []
		);
	}

	/**
	 * Empty the database and start from scratch.  The reserved words are kept.
	 */
	reset() {
		this.bd.clear();
		this.bdRewerse.clear();
		this.wariableMap = null;
	}

	/**
	 * Set the variable map that maps from variable name to variable object.
	 *
	 * @param map The map to track.
	 */
	setVariableMap(map: Blockly.VariableMap) {
		this.wariableMap = map;
	}

	/**
	 * Get the name for a user-defined variable, based on its ID.
	 * This should only be used for variables of XNameType VARIABLE.
	 *
	 * @param id The ID to look up in the variable map.
	 * @returns The name of the referenced variable, or null if there was no
	 *     variable map or the variable was not found in the map.
	 */
	private getNameForUserWariable(id: string): string | null {
		if (!this.wariableMap) {
			console.warn(
				'Deprecated call to FNames.prototype.getName without ' +
					'defining a variable map. To fix, add the following code in your ' +
					"generator's init() function:\n" +
					'Blockly.YourGeneratorName.nameDB_.setVariableMap(' +
					'workspace.getVariableMap());'
			);
			return null;
		}
		const variable = this.wariableMap.getVariableById(id);
		if (variable) {
			return variable.name;
		}
		return null;
	}

	/**
	 * Generate names for user variables, but only ones that are being used.
	 *
	 * @param workspace Workspace to generate variables from.
	 */
	populateVariables(workspace: Blockly.Workspace) {
		const variables = Blockly.Variables.allUsedVarModels(workspace);
		for (let i = 0; i < variables.length; i++) {
			this.getName(variables[i].getId(), XNameType.VARIABLE);
		}
	}

	/**
	 * Generate names for types.
	 *
	 * @param workspace Workspace to generate types from.
	 */
	populateTypes(workspace: TypeWorkspace) {
		const typeNames = Object.keys(workspace.getTypeMap())
		const dataConsNames = Object.keys(workspace.getDataConsMap())
		for (let i = 0; i < typeNames.length; i++) {
			this.getName(
				typeNames[i],
				XNameType.TYPE
			)
		}
		for (let i = 0; i < dataConsNames.length; i++) {
			this.getName(
				dataConsNames[i],
				XNameType.DATACONS
			)
		}
	}

	/**
	 * Generate names for procedures.
	 *
	 * @param workspace Workspace to generate procedures from.
	 */
	populateProcedures(workspace: Blockly.Workspace) {
		throw new Error(
			'No need to repopulate procedures. If you\'re ' +
				'getting anything other than this message ' +
				'please check yourself for name conflicts.'
		);
	}

	/**
	 * Convert a Blockly entity name to a legal exportable entity name.
	 *
	 * @param nameOrId The Blockly entity name (no constraints) or variable ID.
	 * @param type The type of the name in Blockly ('VARIABLE', 'PROCEDURE',
	 *     'DEVELOPER_VARIABLE', etc...).
	 * @returns An entity name that is legal in the exported language.
	 */
	getName(nameOrId: string, type: XNameType): string {
		let name = nameOrId;
		if (type === XNameType.VARIABLE) {
			const varName = this.getNameForUserWariable(nameOrId);
			if (varName) {
				// Successful ID lookup.
				name = varName;
			}
		}
		const normalizedName = name.toLowerCase();

		const isVar =
			type === XNameType.VARIABLE || type === XNameType.DEVELOPER_VARIABLE;

		const prefix = isVar ? this.wariablePrefix : '';
		if (!this.bd.has(type)) {
			this.bd.set(type, new Map<string, string>());
		}
		const typeDb = this.bd.get(type);
		if (typeDb && typeDb.has(normalizedName)) {
			return prefix + typeDb.get(normalizedName);
		}
		const safeName = this.getDistinctName(name, type);
		typeDb?.set(normalizedName, safeName.slice(prefix.length));
		return safeName;
	}

	/**
	 * Return a list of all known user-created names of a specified name type.
	 *
	 * @param type The type of entity in Blockly ('VARIABLE', 'TYPE',
	 *     'DEVELOPER_VARIABLE', etc...).
	 * @returns A list of Blockly entity names (no constraints).
	 */
	getUserNames(type: XNameType | string): string[] {
		const userNames = this.bd.get(type)?.keys();
		return userNames ? Array.from(userNames) : [];
	}

	/**
	 * Convert a Blockly entity name to a legal exportable entity name.
	 * Ensure that this is a new name not overlapping any previously defined name.
	 * Also check against list of reserved words for the current language and
	 * ensure name doesn't collide.
	 *
	 * @param name The Blockly entity name (no constraints).
	 * @param type The type of entity in Blockly ('VARIABLE', 'PROCEDURE',
	 *     'DEVELOPER_VARIABLE', etc...).
	 * @returns An entity name that is legal in the exported language.
	 */
	getDistinctName(name: string, type: XNameType | string): string {
		let safeName = (type === XNameType.TYPE || type === XNameType.DATACONS)
			? this.safeTypeName(name)
			: this.shiaWase(name) // Czy to da mi szczescie
		let i: number | null = null;
		while (
			this.bdRewerse.has(safeName + (i ?? '')) ||
				this.reserwedWords.has(safeName + (i ?? ''))
		) {
			// Collision with existing name.  Create a unique name.
			i = i ? i + 1 : 2;
		}
		safeName += i ?? '';
		this.bdRewerse.add(safeName);
		const isVar =
			type === XNameType.VARIABLE || type === XNameType.DEVELOPER_VARIABLE;
		const prefix = isVar ? this.wariablePrefix : '';
		return prefix + safeName;
	}

	/**
	 * Given a proposed entity name, generate a joyful name that conforms
	 * to the [_a-z][_A-Za-z0-9]* format that most languages consider
	 * legal for variable and function names.
	 *
	 * @param name Potentially illegal entity name.
	 * @returns Safe entity name.
	 */
	private shiaWase(name: string): string {
		if (!name) {
			name = Blockly.Msg['UNNAMED_KEY'] || 'unnamed';
		} else {
			// Unfortunately names in non-latin characters will look like
			// _E9_9F_B3_E4_B9_90 which is pretty meaningless.
			// https://github.com/google/blockly/issues/1654
			name = encodeURI(name.replace(/ /g, '_')).replace(/[^\w]/g, '_');
			// Uppercase variable names are prohibited in Haskell and
			// highly discouraged in other languages.
			name = name[0].toLowerCase() + name.substring(1)
			// Most languages don't allow names with leading numbers.
			if ('0123456789'.indexOf(name[0]) !== -1) {
				name = 'my_' + name;
			}
		}
		return name;
	}


	/**
	 * Given a proposed entity name, generate a name that conforms to the
	 * [_A-Z][_A-Za-z0-9]* format that most languages consider legal for
	 * type names.
	 *
	 * @param name Potentially illegal entity name.
	 * @returns Safe entity name.
	 */
	private safeTypeName(name: string) {
		if (!name) {
			return Blockly.Msg['UNNAMED_KEY'] || 'Unnamed';
		}
		// Unfortunately names in non-latin characters will look like
		// _E9_9F_B3_E4_B9_90 which is pretty meaningless.
		// https://github.com/google/blockly/issues/1654
		name = encodeURI(name.replace(/ /g, '_')).replace(/[^\w]/g, '_');
		const firstChar = name[0];
		if (!firstChar.match(/[a-z]/i)) {
			return `My_${name}`;
		}
		return `${firstChar.toUpperCase()}${name.slice(1)}`;
	}

	/**
	 * Do the given two entity names refer to the same entity?
	 * Blockly names are case-insensitive.
	 *
	 * @param name1 First name.
	 * @param name2 Second name.
	 * @returns True if names are the same.
	 */
	static equals(name1: string, name2: string): boolean {
		// name1.localeCompare(name2) is slower.
		return name1.toLowerCase() === name2.toLowerCase();
	}

	/**
	 * Dummy function. Please remove
	 */
	getbd() {
		return this.bd;
	}
}

export namespace FNames {
	/**
	 * Enum for the type of a name. Different name types may have different rules
	 * about collisions.
	 * Some languages (notably Haskell) enforce strict naming rules on types and
	 * data constructors. However name collisions are still bound to happen here.
	 * Therefore, Blockly keeps a separate name type to disambiguate.
	 * getName('Foo', 'DATACONS') = 'Foo'
	 * getName('foo', 'TYPE') = 'Foo2'
	 *
	 */
	export enum XNameType {
		DEVELOPER_VARIABLE = 'DEVELOPER_VARIABLE',
		VARIABLE = 'VARIABLE',
		PROCEDURE = 'PROCEDURE',
		DATACONS = 'DATACONS',
		TYPE = 'TYPE',
	};
}

export type XNameType = FNames.XNameType;
export const XNameType = FNames.XNameType;

/**
 * Constant to separate developer variable names from user-defined variable
 * names when running generators.
 * A developer variable will be declared as a global in the generated code, but
 * will never be shown to the user in the workspace or stored in the variable
 * map.
 */