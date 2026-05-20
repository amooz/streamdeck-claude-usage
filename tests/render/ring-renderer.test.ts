import { describe, expect, it } from "vitest";

import { RingRenderer } from "../../src/render/ring-renderer.js";
import { emptyWindow, type DisplayConfig, type UsageSnapshot } from "../../src/types.js";

function snapshot(outputTokens = 75000): UsageSnapshot {
	const today = emptyWindow();
	today.total.outputTokens = outputTokens;
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

describe("RingRenderer", () => {
	const renderer = new RingRenderer();
	const display: DisplayConfig = {
		mode: "ring",
		metric: { model: "all", window: "today", field: "outputTokens" },
		denominator: 100000,
		label: null
	};

	it("identifies its mode", () => {
		expect(renderer.mode).toBe("ring");
	});

	it("produces a PNG buffer with a valid signature", () => {
		const buf = renderer.render(snapshot(), display);
		expect(buf.subarray(0, 8)).toEqual(PNG_SIGNATURE);
	});

	it("renders without a denominator (no percent label) without crashing", () => {
		const buf = renderer.render(snapshot(), { ...display, denominator: null });
		expect(buf.length).toBeGreaterThan(0);
	});

	it("handles >100% usage without throwing", () => {
		const buf = renderer.render(snapshot(150000), display);
		expect(buf.length).toBeGreaterThan(0);
	});
});
