import { createCanvas, type SKRSContext2D } from "@napi-rs/canvas";

import { readMetric, type DisplayConfig, type UsageSnapshot } from "../types.js";
import { formatPercent } from "./format.js";
import { drawRing } from "./ring.js";
import { KEY_SIZE, type Renderer } from "./renderer.js";

const BACKGROUND = "#0d0d10";
const VALUE_COLOR = "#ffffff";

export class RingRenderer implements Renderer {
	readonly mode = "ring" as const;

	render(snapshot: UsageSnapshot, display: DisplayConfig): Buffer {
		const canvas = createCanvas(KEY_SIZE, KEY_SIZE);
		const ctx = canvas.getContext("2d");
		drawRingSurface(ctx, snapshot, display);
		return canvas.toBuffer("image/png");
	}
}

export function drawRingSurface(
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

	const raw = readMetric(snapshot, display.metric);
	const fraction = display.denominator && display.denominator > 0 ? raw / display.denominator : 0;

	drawRing(ctx, fraction);

	if (display.denominator && display.denominator > 0) {
		const label = `${snapshot.estimated ? "~" : ""}${formatPercent(fraction)}`;
		ctx.fillStyle = VALUE_COLOR;
		ctx.font = "bold 32px sans-serif";
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		ctx.fillText(label, KEY_SIZE / 2, KEY_SIZE / 2);
	}
}
