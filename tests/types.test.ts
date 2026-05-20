import { describe, expect, it } from "vitest";

import {
	emptyModelUsage,
	emptyWindow,
	MODEL_FAMILIES,
	readMetric,
	WINDOW_KEYS,
	type UsageSnapshot
} from "../src/types.js";

describe("emptyModelUsage", () => {
	it("returns zeros for every counter", () => {
		const u = emptyModelUsage();
		expect(u).toEqual({
			inputTokens: 0,
			outputTokens: 0,
			cacheReadTokens: 0,
			cacheCreationTokens: 0,
			requests: 0
		});
	});
});

describe("emptyWindow", () => {
	it("provides a zeroed slot for every model family", () => {
		const w = emptyWindow();
		expect(w.startedAt).toBeNull();
		for (const m of MODEL_FAMILIES) {
			expect(w.byModel[m]).toEqual(emptyModelUsage());
		}
	});
});

describe("readMetric", () => {
	function snapshot(): UsageSnapshot {
		const empty = emptyWindow();
		const today = emptyWindow();
		today.total = { inputTokens: 10, outputTokens: 20, cacheReadTokens: 5, cacheCreationTokens: 7, requests: 3 };
		today.byModel.opus = {
			inputTokens: 6,
			outputTokens: 12,
			cacheReadTokens: 3,
			cacheCreationTokens: 4,
			requests: 2
		};
		return {
			generatedAt: new Date("2026-05-20T00:00:00Z"),
			estimated: true,
			today,
			session5h: empty,
			weekly: empty,
			allTime: empty
		};
	}

	it("reads a simple field for total", () => {
		const s = snapshot();
		expect(readMetric(s, { window: "today", model: "all", field: "outputTokens" })).toBe(20);
	});

	it("reads a per-model field", () => {
		const s = snapshot();
		expect(readMetric(s, { window: "today", model: "opus", field: "inputTokens" })).toBe(6);
	});

	it("derives totalTokens as sum of every token bucket", () => {
		const s = snapshot();
		expect(readMetric(s, { window: "today", model: "all", field: "totalTokens" })).toBe(10 + 20 + 5 + 7);
	});

	it("covers every documented window key", () => {
		const s = snapshot();
		for (const w of WINDOW_KEYS) {
			expect(() => readMetric(s, { window: w, model: "all", field: "requests" })).not.toThrow();
		}
	});
});
