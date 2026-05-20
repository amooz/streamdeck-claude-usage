// Asks the Windows-side Elgato CLI to restart the plugin after a rebuild.
// Silent no-op if the Windows CLI isn't reachable — keeps `npm run watch`
// usable on dev environments where Stream Deck isn't installed.

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const PLUGIN_UUID = "dev.mooz.streamdeck.claude-usage";

function isWsl() {
	try {
		return readFileSync("/proc/version", "utf8").toLowerCase().includes("microsoft");
	} catch {
		return false;
	}
}

if (!isWsl()) {
	process.exit(0);
}

try {
	execFileSync("cmd.exe", ["/c", "streamdeck", "restart", PLUGIN_UUID], {
		stdio: "inherit"
	});
} catch {
	console.warn(
		`[restart] could not reach Windows-side 'streamdeck' CLI — install '@elgato/cli' on Windows for auto-restart.`
	);
}
