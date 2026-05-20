// Syncs the built .sdPlugin folder into the Windows Stream Deck plugins directory
// when developing from WSL. No-op on native Linux/macOS dev environments — those
// users should run `streamdeck link` directly against the repo's .sdPlugin folder.
//
// Override the destination root with STREAMDECK_PLUGINS_DIR if the default is wrong
// (e.g., a different Windows username, or a non-standard AppData location).

import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import path from "node:path";

const PLUGIN_UUID = "dev.mooz.streamdeck.claude-usage";
const SRC = path.resolve(`${PLUGIN_UUID}.sdPlugin`);

function isWsl() {
	try {
		return readFileSync("/proc/version", "utf8").toLowerCase().includes("microsoft");
	} catch {
		return false;
	}
}

function windowsUsername() {
	if (process.env.STREAMDECK_WIN_USER) return process.env.STREAMDECK_WIN_USER;
	try {
		const out = execFileSync("cmd.exe", ["/c", "echo %USERNAME%"], { stdio: ["ignore", "pipe", "ignore"] });
		return out.toString().trim();
	} catch {
		return null;
	}
}

function resolveDestRoot() {
	if (process.env.STREAMDECK_PLUGINS_DIR) return process.env.STREAMDECK_PLUGINS_DIR;
	if (!isWsl()) return null;
	const user = windowsUsername();
	if (!user) return null;
	return `/mnt/c/Users/${user}/AppData/Roaming/Elgato/StreamDeck/Plugins`;
}

const destRoot = resolveDestRoot();
if (!destRoot) {
	console.log("[sync] not WSL and no STREAMDECK_PLUGINS_DIR set — skipping AppData sync");
	process.exit(0);
}

if (!existsSync(destRoot)) {
	console.warn(`[sync] target dir does not exist: ${destRoot}`);
	console.warn("[sync] is Stream Deck installed on Windows? skipping.");
	process.exit(0);
}

const dest = path.join(destRoot, `${PLUGIN_UUID}.sdPlugin`);

if (existsSync(dest)) {
	rmSync(dest, { recursive: true, force: true });
}
mkdirSync(dest, { recursive: true });
cpSync(SRC, dest, { recursive: true });
console.log(`[sync] copied ${SRC} → ${dest}`);
