import { createCanvas } from "@napi-rs/canvas";
import { describe, expect, it } from "vitest";

import { drawRing, ringColor } from "../../src/render/ring.js";

describe("ringColor", () => {
	it("uses cool color below the warn threshold", () => {
		expect(ringColor(0)).toBe("#4a9eff");
		expect(ringColor(0.5)).toBe("#4a9eff");
	});

	it("switches to amber at 70%", () => {
		expect(ringColor(0.7)).toBe("#f0a800");
		expect(ringColor(0.85)).toBe("#f0a800");
	});

	it("turns red at 90% and above", () => {
		expect(ringColor(0.9)).toBe("#e54c4c");
		expect(ringColor(1)).toBe("#e54c4c");
		expect(ringColor(2)).toBe("#e54c4c");
	});

	it("falls back to cool color for non-finite input", () => {
		expect(ringColor(NaN)).toBe("#4a9eff");
		expect(ringColor(Infinity)).toBe("#e54c4c");
	});
});

describe("drawRing", () => {
	it("renders without throwing for a normal fraction", () => {
		const c = createCanvas(144, 144);
		expect(() => drawRing(c.getContext("2d"), 0.5)).not.toThrow();
	});

	it("renders an empty ring for zero", () => {
		const c = createCanvas(144, 144);
		expect(() => drawRing(c.getContext("2d"), 0)).not.toThrow();
	});

	it("renders a full ring for values >= 1", () => {
		const c = createCanvas(144, 144);
		expect(() => drawRing(c.getContext("2d"), 1.5)).not.toThrow();
	});

	it("tolerates non-finite input by drawing nothing for the progress arc", () => {
		const c = createCanvas(144, 144);
		expect(() => drawRing(c.getContext("2d"), NaN)).not.toThrow();
	});

	it("no-ops when the inset eats the entire radius", () => {
		const c = createCanvas(144, 144);
		expect(() => drawRing(c.getContext("2d"), 0.5, { inset: 80 })).not.toThrow();
	});
});
