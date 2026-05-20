import commonjs from "@rollup/plugin-commonjs";
import nodeResolve from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";
import typescript from "@rollup/plugin-typescript";
import path from "node:path";
import url from "node:url";

const isWatching = !!process.env.ROLLUP_WATCH;
const sdPlugin = "dev.mooz.streamdeck.claude-usage.sdPlugin";

/**
 * @type {import('rollup').RollupOptions}
 */
// Native deps ship as separate npm packages; Rollup can't (and shouldn't) bundle
// their .node binaries. Mark them external so the runtime resolves them through
// node_modules at runtime instead — node_modules is copied alongside bin/ by
// the sync-to-appdata step.
const externalNative = ["@napi-rs/canvas", /^@napi-rs\/canvas-/];

const config = {
	input: "src/plugin.ts",
	external: externalNative,
	output: {
		file: `${sdPlugin}/bin/plugin.js`,
		sourcemap: isWatching,
		sourcemapPathTransform: (relativeSourcePath, sourcemapPath) => {
			return url.pathToFileURL(path.resolve(path.dirname(sourcemapPath), relativeSourcePath)).href;
		}
	},
	plugins: [
		{
			name: "watch-externals",
			buildStart: function () {
				this.addWatchFile(`${sdPlugin}/manifest.json`);
			}
		},
		typescript({
			mapRoot: isWatching ? "./" : undefined
		}),
		nodeResolve({
			browser: false,
			exportConditions: ["node"],
			preferBuiltins: true
		}),
		commonjs(),
		!isWatching && terser(),
		{
			name: "emit-module-package-file",
			generateBundle() {
				this.emitFile({ fileName: "package.json", source: `{ "type": "module" }`, type: "asset" });
			}
		}
	]
};

export default config;
