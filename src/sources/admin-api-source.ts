import { emptyModelUsage, emptyWindow, type ModelFamily, type UsageSnapshot, type WindowUsage } from "../types.js";
import { systemClock, type Clock } from "../util/clock.js";
import {
	AdminApiClient,
	modelFamilyFromBucket,
	type AdminApiBucket,
	type AdminApiClientOptions,
	type AdminApiResult
} from "./admin-api-client.js";
import { SEVEN_DAYS_MS, startOfUtcDay } from "./aggregator.js";
import type { UsageSource } from "./source.js";

export type AdminApiSourceOptions = AdminApiClientOptions & {
	clock?: Clock;
};

/**
 * Fetches authoritative usage from the Anthropic Admin API.
 *
 * - estimated = false (these numbers come from Anthropic).
 * - today: today's daily bucket from the API (UTC).
 * - weekly: sum of last 7 daily buckets.
 * - allTime: same as weekly (the API only goes back as far as we ask).
 * - session5h: empty — "5h session" is a claude.ai subscription concept
 *   that doesn't apply to API-billed usage. Configure a non-session
 *   metric on this source.
 */
export class AdminApiSource implements UsageSource {
	readonly id = "admin-api";
	private readonly client: AdminApiClient;
	private readonly clock: Clock;

	constructor(opts: AdminApiSourceOptions) {
		this.client = new AdminApiClient(opts);
		this.clock = opts.clock ?? systemClock;
	}

	async fetch(): Promise<UsageSnapshot> {
		const now = this.clock.now();
		const endingAt = now;
		const startingAt = new Date(now.getTime() - SEVEN_DAYS_MS);

		const response = await this.client.getUsageByModel(startingAt, endingAt);
		return buildSnapshotFromBuckets(response.data, now);
	}
}

export function buildSnapshotFromBuckets(buckets: readonly AdminApiBucket[], now: Date): UsageSnapshot {
	const startOfToday = startOfUtcDay(now);
	const weekly = emptyWindow();
	weekly.startedAt = new Date(now.getTime() - SEVEN_DAYS_MS);

	const today = emptyWindow();
	today.startedAt = startOfToday;

	for (const bucket of buckets) {
		const bucketStart = new Date(bucket.starting_at);
		const isToday = bucketStart.getTime() >= startOfToday.getTime();
		for (const result of bucket.results) {
			addResult(weekly, result);
			if (isToday) addResult(today, result);
		}
	}

	const allTime = cloneWindow(weekly);
	allTime.startedAt = weekly.startedAt;

	return {
		generatedAt: new Date(now),
		estimated: false,
		today,
		session5h: emptyWindow(),
		weekly,
		allTime
	};
}

function addResult(window: WindowUsage, result: AdminApiResult): void {
	const family: ModelFamily = modelFamilyFromBucket(result);
	const slots = [window.total, window.byModel[family]];
	for (const slot of slots) {
		slot.inputTokens += result.uncached_input_tokens ?? 0;
		slot.outputTokens += result.output_tokens ?? 0;
		slot.cacheReadTokens += result.cache_read_input_tokens ?? 0;
		slot.cacheCreationTokens += result.cache_creation_input_tokens ?? 0;
		slot.requests += 1;
	}
}

function cloneWindow(w: WindowUsage): WindowUsage {
	const out = emptyWindow();
	out.startedAt = w.startedAt;
	out.total = { ...w.total };
	for (const m of Object.keys(w.byModel) as ModelFamily[]) {
		out.byModel[m] = { ...w.byModel[m] };
	}
	// Suppress lint warning that emptyModelUsage is unused if it ever shakes out.
	void emptyModelUsage;
	return out;
}
