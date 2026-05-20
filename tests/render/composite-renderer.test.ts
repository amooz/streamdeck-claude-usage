import { describe, expect, it } from "vitest";

import { CompositeRenderer } from "../../src/render/composite-renderer.js";
import { emptyWindow, type DisplayConfig, type UsageSnapshot } from "../../src/types.js";

function snapshot(): UsageSnapshot {
	const today = emptyWindow();
	today.total.outputTokens = 35600;
	return {
		generatedAt: new Date("2026-05-20T12:00:00Z"),
		estimated: true,
		today,
		session5h: emptyWindow(),
		weekly: emptyWindow(),
		allTime: emptyWindow()
	};
}

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

describe("CompositeRenderer", () => {
	const renderer = new CompositeRenderer();
	const display: DisplayConfig = {
		mode: "ring+text",
		metric: { model: "all", window: "today", field: "outputTokens" },
		denominator: 100000,
		label: null
	};

	it("identifies its mode", () => {
		expect(renderer.mode).toBe("ring+text");
	});

	it("produces a PNG buffer", () => {
		const buf = renderer.render(snapshot(), display);
		expect(buf.subarray(0, 8)).toEqual(PNG_SIGNATURE);
		expect(buf.length).toBeGreaterThan(0);
	});

	it("renders without a denominator (no ring fill) without crashing", () => {
		const buf = renderer.render(snapshot(), { ...display, denominator: null });
		expect(buf.length).toBeGreaterThan(0);
	});
});
