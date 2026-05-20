import { readdirSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";

export const DEFAULT_PROJECTS_ROOT = path.join(homedir(), ".claude", "projects");

/**
 * Claude Code encodes project directories by replacing path separators with
 * dashes. e.g., /home/amooz/src/foo → -home-amooz-src-foo. This recovers a
 * readable label from the encoded directory name.
 */
export function decodeProjectName(encoded: string): string {
	if (!encoded.startsWith("-")) return encoded;
	return "/" + encoded.slice(1).replace(/-/g, "/");
}

export type ProjectInfo = {
	encodedName: string;
	displayPath: string;
	absoluteDir: string;
};

export function listProjects(root: string = DEFAULT_PROJECTS_ROOT): ProjectInfo[] {
	let entries: string[];
	try {
		entries = readdirSync(root);
	} catch {
		return [];
	}
	return entries
		.map((name) => ({
			encodedName: name,
			displayPath: decodeProjectName(name),
			absoluteDir: path.join(root, name)
		}))
		.sort((a, b) => a.displayPath.localeCompare(b.displayPath));
}
