import { createCanvas } from "@napi-rs/canvas";

import { BEZEL_INSET, KEY_SIZE } from "./renderer.js";

const BACKGROUND = "#2a0e0e";
const TEXT_COLOR = "#ff6b6b";

/**
 * Renders a minimal error tile so a button never goes blank when the
 * source can't reach Anthropic or read the logs. Caller passes one
 * short reason ("auth", "offline", "ratelimit", ...) which lands as
 * the small subtitle under "ERR".
 */
export function renderError(reason: string): Buffer {
	const canvas = createCanvas(KEY_SIZE, KEY_SIZE);
	const ctx = canvas.getContext("2d");

	ctx.fillStyle = BACKGROUND;
	ctx.fillRect(0, 0, KEY_SIZE, KEY_SIZE);

	ctx.fillStyle = TEXT_COLOR;
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";

	ctx.font = "bold 40px sans-serif";
	ctx.fillText("ERR", KEY_SIZE / 2, KEY_SIZE / 2 - 8);

	ctx.font = "12px sans-serif";
	const maxWidth = KEY_SIZE - 2 * BEZEL_INSET;
	let label = reason;
	while (ctx.measureText(label).width > maxWidth && label.length > 3) {
		label = `${label.slice(0, -2)}…`;
	}
	ctx.fillText(label, KEY_SIZE / 2, KEY_SIZE / 2 + 28);

	return canvas.toBuffer("image/png");
}

/**
 * Classifies an arbitrary thrown error into a short, human-readable
 * reason suitable for the error tile.
 */
export function reasonForError(err: unknown): string {
	if (err && typeof err === "object" && "status" in err && typeof (err as { status: number }).status === "number") {
		const status = (err as { status: number }).status;
		if (status === 401 || status === 403) return "auth";
		if (status === 429) return "rate limit";
		if (status >= 500) return `api ${status}`;
		return `http ${status}`;
	}
	const msg = err instanceof Error ? err.message : String(err);
	if (/ENOTFOUND|ECONN|fetch failed|timeout/i.test(msg)) return "offline";
	return "error";
}
