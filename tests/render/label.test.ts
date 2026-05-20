import { describe, expect, it } from "vitest";

import { defaultLabel, formatValue, labelFor } from "../../src/render/label.js";
import { emptyWindow, type DisplayConfig, type UsageSnapshot } from "../../src/types.js";

function snapshot(opts: { outputTokens?: number; estimated?: boolean } = {}): UsageSnapshot {
	const today = emptyWindow();
	today.total.outputTokens = opts.outputTokens ?? 0;
	today.byModel.opus.outputTokens = opts.outputTokens ?? 0;
	return {
		generatedAt: new Date("2026-05-20T12:00:00Z"),
		estimated: opts.estimated ?? true,
		today,
		session5h: emptyWindow(),
		weekly: emptyWindow(),
		allTime: emptyWindow()
	};
}

describe("defaultLabel", () => {
	it("composes model + window + field for a per-model metric", () => {
		expect(defaultLabel({ model: "opus", window: "session5h", field: "outputTokens" })).toBe("Opus 5h out");
	});

	it("omits the model segment for the 'all' aggregate", () => {
		expect(defaultLabel({ model: "all", window: "today", field: "totalTokens" })).toBe("Today tok");
	});
});

describe("labelFor", () => {
	it("prefers an explicit override over the default", () => {
		const display: DisplayConfig = {
			mode: "text",
			metric: { model: "opus", window: "session5h", field: "outputTokens" },
			denominator: null,
			label: "Opus burn"
		};
		expect(labelFor(display)).toBe("Opus burn");
	});

	it("falls back to the default label when none is provided", () => {
		const display: DisplayConfig = {
			mode: "text",
			metric: { model: "opus", window: "today", field: "outputTokens" },
			denominator: null,
			label: null
		};
		expect(labelFor(display)).toBe("Opus Today out");
	});
});

describe("formatValue", () => {
	it("renders compact numbers when no denominator is set", () => {
		const display: DisplayConfig = {
			mode: "text",
			metric: { model: "all", window: "today", field: "outputTokens" },
			denominator: null,
			label: null
		};
		expect(formatValue(snapshot({ outputTokens: 35600 }), display)).toBe("~35.6k");
	});

	it("renders a percentage when a denominator is set", () => {
		const display: DisplayConfig = {
			mode: "ring",
			metric: { model: "all", window: "today", field: "outputTokens" },
			denominator: 100000,
			label: null
		};
		expect(formatValue(snapshot({ outputTokens: 35600 }), display)).toBe("~36%");
	});

	it("omits the estimate marker when the snapshot is authoritative", () => {
		const display: DisplayConfig = {
			mode: "text",
			metric: { model: "all", window: "today", field: "outputTokens" },
			denominator: null,
			label: null
		};
		expect(formatValue(snapshot({ outputTokens: 35600, estimated: false }), display)).toBe("35.6k");
	});
});
