import { describe, expect, it } from "vitest";

import { AdminApiSource, buildSnapshotFromBuckets } from "../../src/sources/admin-api-source.js";
import type { AdminApiBucket } from "../../src/sources/admin-api-client.js";
import { fixedClock } from "../../src/util/clock.js";

function bucket(opts: {
	day: string;
	model: string;
	input?: number;
	output?: number;
	cacheRead?: number;
	cacheCreate?: number;
}): AdminApiBucket {
	const start = new Date(opts.day);
	return {
		starting_at: start.toISOString(),
		ending_at: new Date(start.getTime() + 24 * 60 * 60 * 1000).toISOString(),
		results: [
			{
				uncached_input_tokens: opts.input ?? 0,
				output_tokens: opts.output ?? 0,
				cache_read_input_tokens: opts.cacheRead ?? 0,
				cache_creation_input_tokens: opts.cacheCreate ?? 0,
				group_by: { model: opts.model }
			}
		]
	};
}

describe("buildSnapshotFromBuckets", () => {
	const now = new Date("2026-05-20T14:00:00Z");

	it("marks the snapshot as authoritative (estimated = false)", () => {
		const s = buildSnapshotFromBuckets([], now);
		expect(s.estimated).toBe(false);
	});

	it("leaves session5h empty (API has no 5h concept)", () => {
		const s = buildSnapshotFromBuckets(
			[bucket({ day: "2026-05-20T00:00:00Z", model: "claude-opus-4-7", output: 100 })],
			now
		);
		expect(s.session5h.total.outputTokens).toBe(0);
		expect(s.session5h.startedAt).toBeNull();
	});

	it("sums daily buckets into the weekly window and the today bucket into today", () => {
		const buckets = [
			bucket({ day: "2026-05-19T00:00:00Z", model: "claude-opus-4-7", output: 200 }),
			bucket({ day: "2026-05-20T00:00:00Z", model: "claude-opus-4-7", output: 50 }),
			bucket({ day: "2026-05-20T00:00:00Z", model: "claude-sonnet-4-6", output: 25 })
		];
		const s = buildSnapshotFromBuckets(buckets, now);
		expect(s.weekly.total.outputTokens).toBe(275);
		expect(s.today.total.outputTokens).toBe(75);
		expect(s.today.byModel.opus.outputTokens).toBe(50);
		expect(s.today.byModel.sonnet.outputTokens).toBe(25);
	});

	it("treats allTime as equal to weekly (we only fetch a 7d window)", () => {
		const buckets = [bucket({ day: "2026-05-19T00:00:00Z", model: "claude-opus-4-7", output: 200 })];
		const s = buildSnapshotFromBuckets(buckets, now);
		expect(s.allTime.total.outputTokens).toBe(s.weekly.total.outputTokens);
	});
});

describe("AdminApiSource.fetch", () => {
	it("hits the API and converts the response into a snapshot", async () => {
		let calls = 0;
		const fetchImpl: typeof fetch = async () => {
			calls++;
			return new Response(
				JSON.stringify({
					data: [bucket({ day: "2026-05-20T00:00:00Z", model: "claude-opus-4-7", output: 42 })]
				}),
				{ status: 200, headers: { "content-type": "application/json" } }
			);
		};
		const source = new AdminApiSource({
			apiKey: "sk-ant-admin-x",
			fetchImpl,
			clock: fixedClock("2026-05-20T14:00:00Z")
		});
		const snap = await source.fetch();
		expect(calls).toBe(1);
		expect(snap.estimated).toBe(false);
		expect(snap.today.total.outputTokens).toBe(42);
		expect(source.id).toBe("admin-api");
	});

	it("propagates API errors so the action's poller can surface them", async () => {
		const fetchImpl: typeof fetch = async () => new Response("forbidden", { status: 403 });
		const source = new AdminApiSource({ apiKey: "x", fetchImpl, clock: fixedClock("2026-05-20T14:00:00Z") });
		await expect(source.fetch()).rejects.toThrow(/HTTP 403/);
	});
});
