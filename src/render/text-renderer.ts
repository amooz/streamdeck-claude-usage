import { createCanvas, type SKRSContext2D } from "@napi-rs/canvas";

import type { DisplayConfig, UsageSnapshot } from "../types.js";
import { formatValue, labelFor } from "./label.js";
import { BEZEL_INSET, KEY_SIZE, type Renderer } from "./renderer.js";

const BACKGROUND = "#0d0d10";
const LABEL_COLOR = "#9aa0a6";
const VALUE_COLOR = "#ffffff";
const LABEL_FONT = "bold 18px sans-serif";

export class TextRenderer implements Renderer {
	readonly mode = "text" as const;

	render(snapshot: UsageSnapshot, display: DisplayConfig): Buffer {
		const canvas = createCanvas(KEY_SIZE, KEY_SIZE);
		const ctx = canvas.getContext("2d");
		drawTextSurface(ctx, snapshot, display);
		return canvas.toBuffer("image/png");
	}
}

/**
 * Exported so the composite (ring+text) renderer can draw the text body
 * into a canvas the ring already painted on. Both modes share one layout.
 */
export function drawTextSurface(
	ctx: SKRSContext2D,
	snapshot: UsageSnapshot,
	display: DisplayConfig,
	options: { background?: string | null } = {}
): void {
	const bg = options.background === undefined ? BACKGROUND : options.background;
	if (bg !== null) {
		ctx.fillStyle = bg;
		ctx.fillRect(0, 0, KEY_SIZE, KEY_SIZE);
	}

	const label = labelFor(display);
	const value = formatValue(snapshot, display);

	ctx.fillStyle = LABEL_COLOR;
	ctx.font = LABEL_FONT;
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";
	ctx.fillText(label, KEY_SIZE / 2, BEZEL_INSET + 14);

	ctx.fillStyle = VALUE_COLOR;
	ctx.font = pickValueFont(ctx, value);
	ctx.fillText(value, KEY_SIZE / 2, KEY_SIZE / 2 + 14);
}

/**
 * Scales the value font down until it fits the key's safe inset, so a long
 * "1.2M" doesn't crash into the bezel on either side.
 */
function pickValueFont(ctx: SKRSContext2D, value: string): string {
	const maxWidth = KEY_SIZE - 2 * BEZEL_INSET - 8;
	for (const size of [52, 46, 40, 34, 28]) {
		const candidate = `bold ${size}px sans-serif`;
		ctx.font = candidate;
		if (ctx.measureText(value).width <= maxWidth) return candidate;
	}
	return "bold 24px sans-serif";
}

/**
 * Turn a renderer's PNG buffer into the data URI Stream Deck expects from
 * setImage(). Kept here so any renderer can share it.
 */
export function bufferToDataUri(buffer: Buffer): string {
	return `data:image/png;base64,${buffer.toString("base64")}`;
}
