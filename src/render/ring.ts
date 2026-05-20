import type { SKRSContext2D } from "@napi-rs/canvas";

import { BEZEL_INSET, KEY_SIZE } from "./renderer.js";

export const RING_STROKE = 10;
export const RING_TRACK_COLOR = "#2a2a30";

/**
 * Picks the foreground color of the progress arc based on how much of the
 * budget has been consumed. Cool when there's headroom, warm as it fills,
 * red once we're at the edge.
 */
export function ringColor(fraction: number): string {
	if (Number.isNaN(fraction)) return "#4a9eff";
	if (fraction >= 0.9) return "#e54c4c";
	if (fraction >= 0.7) return "#f0a800";
	return "#4a9eff";
}

export type RingOptions = {
	stroke?: number;
	inset?: number;
	trackColor?: string;
};

/**
 * Draws the empty track + progress arc onto the canvas. `fraction` is clamped
 * to [0,1]; values above 1 are rendered as a full ring (we let the text body
 * communicate the overflow, the ring just visually pegs).
 */
export function drawRing(ctx: SKRSContext2D, fraction: number, options: RingOptions = {}): void {
	const stroke = options.stroke ?? RING_STROKE;
	const inset = options.inset ?? BEZEL_INSET;
	const trackColor = options.trackColor ?? RING_TRACK_COLOR;

	const cx = KEY_SIZE / 2;
	const cy = KEY_SIZE / 2;
	const radius = (KEY_SIZE - 2 * inset - stroke) / 2;
	if (radius <= 0) return;

	ctx.save();
	ctx.lineWidth = stroke;
	ctx.lineCap = "round";

	ctx.strokeStyle = trackColor;
	ctx.beginPath();
	ctx.arc(cx, cy, radius, 0, Math.PI * 2);
	ctx.stroke();

	const clamped = Number.isFinite(fraction) ? Math.max(0, Math.min(1, fraction)) : 0;
	if (clamped > 0) {
		ctx.strokeStyle = ringColor(clamped);
		ctx.beginPath();
		const start = -Math.PI / 2;
		const end = start + clamped * Math.PI * 2;
		ctx.arc(cx, cy, radius, start, end);
		ctx.stroke();
	}

	ctx.restore();
}
