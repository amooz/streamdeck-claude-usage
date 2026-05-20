import { createCanvas } from "@napi-rs/canvas";

import { readMetric, type DisplayConfig, type UsageSnapshot } from "../types.js";
import { drawRing } from "./ring.js";
import { drawTextSurface } from "./text-renderer.js";
import { KEY_SIZE, type Renderer } from "./renderer.js";

const BACKGROUND = "#0d0d10";

export class CompositeRenderer implements Renderer {
	readonly mode = "ring+text" as const;

	render(snapshot: UsageSnapshot, display: DisplayConfig): Buffer {
		const canvas = createCanvas(KEY_SIZE, KEY_SIZE);
		const ctx = canvas.getContext("2d");

		ctx.fillStyle = BACKGROUND;
		ctx.fillRect(0, 0, KEY_SIZE, KEY_SIZE);

		const raw = readMetric(snapshot, display.metric);
		const fraction = display.denominator && display.denominator > 0 ? raw / display.denominator : 0;
		drawRing(ctx, fraction, { stroke: 8 });
		// Text on top of the ring; suppress the inner background so the ring is visible.
		drawTextSurface(ctx, snapshot, display, { background: null });

		return canvas.toBuffer("image/png");
	}
}
