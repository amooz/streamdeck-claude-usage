import { describe, expect, it } from "vitest";

import {
	buildSnapshot,
	findActive5hWindow,
	FIVE_HOURS_MS,
	startOfLocalDay,
	sumModelUsages
} from "../../src/sources/aggregator.js";
import type { ParsedAssistantEntry } from "../../src/sources/jsonl-parser.js";
import { emptyModelUsage } from "../../src/types.js";

function entry(opts: {
	at: string;
	model?: "opus" | "sonnet" | "haiku" | "other";
	input?: number;
	output?: number;
	cacheRead?: number;
	cacheCreate?: number;
}): ParsedAssistantEntry {
	return {
		timestamp: new Date(opts.at),
		sessionId: "s",
		model: opts.model ?? "opus",
		rawModel: opts.model ?? "opus",
		inputTokens: opts.input ?? 0,
		outputTokens: opts.output ?? 0,
		cacheReadTokens: opts.cacheRead ?? 0,
		cacheCreationTokens: opts.cacheCreate ?? 0
	};
}

describe("startOfLocalDay", () => {
	it("zeroes out time components", () => {
		const d = startOfLocalDay(new Date("2026-05-20T14:33:17.500Z"));
		expect(d.getHours()).toBe(0);
		expect(d.getMinutes()).toBe(0);
		expect(d.getSeconds()).toBe(0);
		expect(d.getMilliseconds()).toBe(0);
	});
});

describe("findActive5hWindow", () => {
	it("returns null when there are no entries", () => {
		expect(findActive5hWindow([], new Date("2026-05-20T12:00:00Z"))).toBeNull();
	});

	it("returns null when the most recent activity is older than 5h", () => {
		const entries = [entry({ at: "2026-05-20T00:00:00Z" })];
		const now = new Date("2026-05-20T06:00:00Z");
		expect(findActive5hWindow(entries, now)).toBeNull();
	});

	it("anchors the window to the first message of a sustained burst", () => {
		const entries = [
			entry({ at: "2026-05-20T10:00:00Z" }),
			entry({ at: "2026-05-20T10:30:00Z" }),
			entry({ at: "2026-05-20T11:15:00Z" })
		];
		const now = new Date("2026-05-20T12:00:00Z");
		const win = findActive5hWindow(entries, now);
		expect(win).not.toBeNull();
		expect(win!.startedAt.toISOString()).toBe("2026-05-20T10:00:00.000Z");
		expect(win!.endsAt!.toISOString()).toBe("2026-05-20T15:00:00.000Z");
	});

	it("resets the window after a >=5h idle gap", () => {
		const entries = [
			entry({ at: "2026-05-20T01:00:00Z" }),
			entry({ at: "2026-05-20T01:30:00Z" }),
			// 5h+ gap
			entry({ at: "2026-05-20T07:00:00Z" }),
			entry({ at: "2026-05-20T07:30:00Z" })
		];
		const now = new Date("2026-05-20T08:00:00Z");
		const win = findActive5hWindow(entries, now);
		expect(win!.startedAt.toISOString()).toBe("2026-05-20T07:00:00.000Z");
	});

	it("treats exactly 5h gaps as window resets", () => {
		const t0 = new Date("2026-05-20T00:00:00Z");
		const t1 = new Date(t0.getTime() + FIVE_HOURS_MS);
		const entries = [{ ...entry({ at: t0.toISOString() }) }, { ...entry({ at: t1.toISOString() }) }];
		const win = findActive5hWindow(entries, t1);
		expect(win!.startedAt.toISOString()).toBe(t1.toISOString());
	});
});

describe("buildSnapshot", () => {
	const now = new Date("2026-05-20T14:00:00Z");

	it("returns an empty snapshot when there are no entries", () => {
		const s = buildSnapshot([], now);
		expect(s.estimated).toBe(true);
		expect(s.today.total).toEqual(emptyModelUsage());
		expect(s.session5h.total).toEqual(emptyModelUsage());
		expect(s.allTime.startedAt).toBeNull();
	});

	it("partitions usage across today / 5h / weekly / all-time correctly", () => {
		const entries = [
			entry({ at: "2026-05-01T10:00:00Z", model: "opus", output: 100 }),
			entry({ at: "2026-05-19T10:00:00Z", model: "opus", output: 50 }),
			entry({ at: "2026-05-20T12:00:00Z", model: "opus", output: 10 }),
			entry({ at: "2026-05-20T13:00:00Z", model: "sonnet", output: 5 })
		];
		const s = buildSnapshot(entries, now);
		expect(s.allTime.total.outputTokens).toBe(165);
		expect(s.weekly.total.outputTokens).toBe(65);
		expect(s.today.total.outputTokens).toBe(15);
		expect(s.today.byModel.opus.outputTokens).toBe(10);
		expect(s.today.byModel.sonnet.outputTokens).toBe(5);
		expect(s.session5h.total.outputTokens).toBe(15);
	});

	it("counts request occurrences per model", () => {
		const entries = [
			entry({ at: "2026-05-20T13:00:00Z", model: "opus" }),
			entry({ at: "2026-05-20T13:30:00Z", model: "opus" }),
			entry({ at: "2026-05-20T13:45:00Z", model: "sonnet" })
		];
		const s = buildSnapshot(entries, now);
		expect(s.today.byModel.opus.requests).toBe(2);
		expect(s.today.byModel.sonnet.requests).toBe(1);
		expect(s.today.total.requests).toBe(3);
	});

	it("tolerates entries arriving in unsorted order", () => {
		const entries = [
			entry({ at: "2026-05-20T13:00:00Z", output: 10 }),
			entry({ at: "2026-05-20T12:00:00Z", output: 5 }),
			entry({ at: "2026-05-20T13:30:00Z", output: 7 })
		];
		const s = buildSnapshot(entries, now);
		expect(s.allTime.startedAt!.toISOString()).toBe("2026-05-20T12:00:00.000Z");
		expect(s.today.total.outputTokens).toBe(22);
	});
});

describe("sumModelUsages", () => {
	it("adds usages element-wise", () => {
		const a = { ...emptyModelUsage(), inputTokens: 1, requests: 1 };
		const b = { ...emptyModelUsage(), inputTokens: 2, outputTokens: 3, requests: 2 };
		const out = sumModelUsages(a, b);
		expect(out.inputTokens).toBe(3);
		expect(out.outputTokens).toBe(3);
		expect(out.requests).toBe(3);
	});

	it("returns an empty usage when given no inputs", () => {
		expect(sumModelUsages()).toEqual(emptyModelUsage());
	});
});
