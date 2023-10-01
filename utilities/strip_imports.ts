import { argv } from "node:process";
import { open, FileHandle } from "node:fs/promises";

if (argv.length <= 2) {
	console.log("Strip import tool\nSynopsis: command [file1] [file2]...");
}

/**
 * Strip imports from a string
 * @param content The file content
 * @returns A modified file with all imports removed
 */
function removeImportLines(content: string) {
	const lines = content.split("\n");
	const filter = lines.filter(line => !line.startsWith("import"));
	return filter.join("\n");
}

/**
 * Modifies a file according to a transformation function
 * @param filepath The path to the file to modify
 * @param transformFunc The function that modifies the file contents
 */
async function processFile(filepath: string, transformFunc: (content: string) => string) {
	try {
		const readHandle = await open(filepath, "r");
		const content = await readHandle.readFile("utf-8");
		await readHandle.close();
		const newContent = transformFunc(content);
		const writeHandle = await open(filepath, "w");
		await writeHandle.writeFile(newContent, "utf-8");
		await writeHandle.close();
	} catch (error) {
		console.error(`Can't process file ${filepath}: ${error.message}`)
	}
}

for (let i = 2; i < argv.length; i++) {
	processFile(argv[i], removeImportLines);
}