import { describe, expect, it } from "vitest";

import { registerRenderer, renderButton, rendererFor } from "../../src/render/index.js";
import type { Renderer } from "../../src/render/renderer.js";
import { TextRenderer } from "../../src/render/text-renderer.js";
import { emptyWindow, type DisplayConfig, type DisplayMode, type UsageSnapshot } from "../../src/types.js";

function snapshot(): UsageSnapshot {
	return {
		generatedAt: new Date("2026-05-20T12:00:00Z"),
		estimated: true,
		today: emptyWindow(),
		session5h: emptyWindow(),
		weekly: emptyWindow(),
		allTime: emptyWindow()
	};
}

describe("rendererFor", () => {
	it("returns a renderer for every documented mode", () => {
		const modes: DisplayMode[] = ["text", "ring", "ring+text"];
		for (const mode of modes) {
			expect(rendererFor(mode)).toBeDefined();
		}
	});
});

describe("registerRenderer", () => {
	it("replaces a registered renderer", () => {
		const fake: Renderer = {
			mode: "ring",
			render: () => Buffer.from("xx")
		};
		const original = rendererFor("ring");
		registerRenderer("ring", fake);
		try {
			expect(rendererFor("ring")).toBe(fake);
		} finally {
			registerRenderer("ring", original);
		}
	});
});

describe("renderButton", () => {
	it("delegates to the renderer matching display.mode", () => {
		const display: DisplayConfig = {
			mode: "text",
			metric: { model: "all", window: "today", field: "outputTokens" },
			denominator: null,
			label: null
		};
		const buf = renderButton(snapshot(), display);
		expect(buf.length).toBeGreaterThan(0);
		// Ensure rendererFor returns the actual TextRenderer for text mode.
		expect(rendererFor("text")).toBeInstanceOf(TextRenderer);
	});
});
