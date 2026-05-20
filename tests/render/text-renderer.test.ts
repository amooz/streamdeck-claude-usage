import { describe, expect, it } from "vitest";

import { bufferToDataUri, TextRenderer } from "../../src/render/text-renderer.js";
import { emptyWindow, type DisplayConfig, type UsageSnapshot } from "../../src/types.js";

function snapshot(): UsageSnapshot {
	const today = emptyWindow();
	today.total.outputTokens = 1234;
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

describe("TextRenderer", () => {
	const display: DisplayConfig = {
		mode: "text",
		metric: { model: "all", window: "today", field: "outputTokens" },
		denominator: null,
		label: null
	};
	const renderer = new TextRenderer();

	it("produces a non-empty PNG buffer", () => {
		const buf = renderer.render(snapshot(), display);
		expect(buf.length).toBeGreaterThan(0);
		expect(buf.subarray(0, 8)).toEqual(PNG_SIGNATURE);
	});

	it("identifies its mode", () => {
		expect(renderer.mode).toBe("text");
	});

	it("scales down to fit very long values", () => {
		const huge: UsageSnapshot = (() => {
			const s = snapshot();
			s.today.total.outputTokens = 9_999_999_999;
			return s;
		})();
		// Just verifying it doesn't throw; the font-fallback path is exercised internally.
		const buf = renderer.render(huge, display);
		expect(buf.length).toBeGreaterThan(0);
	});

	it("renders a percent variant when a denominator is set", () => {
		const pctDisplay: DisplayConfig = { ...display, denominator: 5000 };
		const buf = renderer.render(snapshot(), pctDisplay);
		expect(buf.length).toBeGreaterThan(0);
	});
});

describe("bufferToDataUri", () => {
	it("wraps a buffer as a base64 image data URI", () => {
		const uri = bufferToDataUri(Buffer.from([1, 2, 3]));
		expect(uri).toBe("data:image/png;base64,AQID");
	});
});
