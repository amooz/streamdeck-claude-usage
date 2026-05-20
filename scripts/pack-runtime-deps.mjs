// Copies the production-dep tree that the bundled plugin.js can't inline
// (native modules + anything marked external in rollup.config.mjs) into
// <sdPlugin>/bin/node_modules/, so Node's resolver finds them at runtime.
//
// Platform binaries (mac/windows/linux variants of @napi-rs/canvas) are
// fetched directly from the npm registry as tarballs — host npm install
// only ships the binary matching the build host, so we can't rely on
// node_modules alone for cross-platform packaging.

import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const PLUGIN_UUID = "dev.mooz.streamdeck.claude-usage";
const ROOT_NM = path.resolve("node_modules");
const DEST_NM = path.resolve(`${PLUGIN_UUID}.sdPlugin`, "bin", "node_modules");

const CANVAS_VERSION = readVersion("@napi-rs/canvas") ?? "1.0.0";

// Platform binaries we ship inside .streamDeckPlugin so the plugin runs on
// every machine Stream Deck supports. Adam's primary install is win32-x64.
const PLATFORM_BINARIES = [
	"@napi-rs/canvas-win32-x64-msvc",
	"@napi-rs/canvas-darwin-x64",
	"@napi-rs/canvas-darwin-arm64",
	"@napi-rs/canvas-linux-x64-gnu"
];

// Top-level deps to package. Native bins are handled separately above.
const TOP_LEVEL = ["@napi-rs/canvas"];

function readVersion(pkgName) {
	try {
		const pkg = JSON.parse(readFileSync(path.join(ROOT_NM, pkgName, "package.json"), "utf8"));
		return pkg.version;
	} catch {
		return null;
	}
}

function copyLocalPackage(name) {
	const src = path.join(ROOT_NM, name);
	const dest = path.join(DEST_NM, name);
	if (!existsSync(src)) {
		console.warn(`[pack-deps] source missing: ${src}`);
		return;
	}
	rmSync(dest, { recursive: true, force: true });
	mkdirSync(path.dirname(dest), { recursive: true });
	cpSync(src, dest, { recursive: true, dereference: true });
}

function downloadPlatformBinary(name, version) {
	const dest = path.join(DEST_NM, name);
	if (existsSync(path.join(dest, "package.json"))) return; // already present, no-op

	const tmp = path.join(tmpdir(), `pack-deps-${Date.now()}-${Math.random().toString(36).slice(2)}`);
	mkdirSync(tmp, { recursive: true });
	try {
		execFileSync("npm", ["pack", `${name}@${version}`, "--silent"], { cwd: tmp });
		const tarballs = readdirSync(tmp).filter((f) => f.endsWith(".tgz"));
		if (tarballs.length === 0) throw new Error(`no tarball downloaded for ${name}`);
		const tar = path.join(tmp, tarballs[0]);
		const extract = path.join(tmp, "extract");
		mkdirSync(extract, { recursive: true });
		execFileSync("tar", ["-xzf", tar, "-C", extract]);
		rmSync(dest, { recursive: true, force: true });
		mkdirSync(path.dirname(dest), { recursive: true });
		cpSync(path.join(extract, "package"), dest, { recursive: true });
		console.log(`[pack-deps] fetched ${name}@${version}`);
	} finally {
		rmSync(tmp, { recursive: true, force: true });
	}
}

mkdirSync(DEST_NM, { recursive: true });

for (const name of TOP_LEVEL) {
	copyLocalPackage(name);
}
for (const name of PLATFORM_BINARIES) {
	try {
		downloadPlatformBinary(name, CANVAS_VERSION);
	} catch (err) {
		console.warn(`[pack-deps] could not fetch ${name}: ${err instanceof Error ? err.message : err}`);
	}
}

console.log(`[pack-deps] runtime deps ready at ${path.relative(process.cwd(), DEST_NM)}`);
