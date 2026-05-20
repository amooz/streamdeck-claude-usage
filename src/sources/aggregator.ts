import {
	emptyModelUsage,
	emptyWindow,
	type ModelFamily,
	type ModelUsage,
	type UsageSnapshot,
	type WindowUsage
} from "../types.js";
import type { ParsedAssistantEntry } from "./jsonl-parser.js";

export const FIVE_HOURS_MS = 5 * 60 * 60 * 1000;
export const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export type WindowBounds = {
	startedAt: Date;
	endsAt: Date | null;
};

export function startOfLocalDay(at: Date): Date {
	const d = new Date(at);
	d.setHours(0, 0, 0, 0);
	return d;
}

/**
 * Anthropic's 5-hour session counter starts at the first message after a >=5h
 * idle gap and runs for 5h. This walks the timeline to find the most recent
 * such window. Returns null when the most recent window has already expired.
 */
export function findActive5hWindow(entriesAsc: readonly ParsedAssistantEntry[], now: Date): WindowBounds | null {
	if (entriesAsc.length === 0) return null;
	let windowStart = entriesAsc[0].timestamp;
	for (let i = 1; i < entriesAsc.length; i++) {
		const gap = entriesAsc[i].timestamp.getTime() - entriesAsc[i - 1].timestamp.getTime();
		if (gap >= FIVE_HOURS_MS) {
			windowStart = entriesAsc[i].timestamp;
		}
	}
	const endsAt = new Date(windowStart.getTime() + FIVE_HOURS_MS);
	if (now.getTime() > endsAt.getTime()) {
		return null;
	}
	return { startedAt: windowStart, endsAt };
}

function addEntry(usage: ModelUsage, e: ParsedAssistantEntry): void {
	usage.inputTokens += e.inputTokens;
	usage.outputTokens += e.outputTokens;
	usage.cacheReadTokens += e.cacheReadTokens;
	usage.cacheCreationTokens += e.cacheCreationTokens;
	usage.requests += 1;
}

function sumInto(window: WindowUsage, entries: readonly ParsedAssistantEntry[]): void {
	for (const e of entries) {
		addEntry(window.total, e);
		addEntry(window.byModel[e.model], e);
	}
}

function filterRange(
	entriesAsc: readonly ParsedAssistantEntry[],
	startMs: number,
	endMs: number
): ParsedAssistantEntry[] {
	const out: ParsedAssistantEntry[] = [];
	for (const e of entriesAsc) {
		const t = e.timestamp.getTime();
		if (t >= startMs && t <= endMs) out.push(e);
	}
	return out;
}

/**
 * Build a UsageSnapshot from raw entries and the current time. Entries don't
 * need to be sorted — this sorts them. estimated is always true for local-logs
 * because we're reconstructing what the server-side counter enforces.
 */
export function buildSnapshot(rawEntries: readonly ParsedAssistantEntry[], now: Date): UsageSnapshot {
	const entries = [...rawEntries].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
	const nowMs = now.getTime();

	const today = emptyWindow();
	const startOfDay = startOfLocalDay(now);
	today.startedAt = startOfDay;
	sumInto(today, filterRange(entries, startOfDay.getTime(), nowMs));

	const session5h = emptyWindow();
	const win = findActive5hWindow(entries, now);
	if (win) {
		session5h.startedAt = win.startedAt;
		sumInto(session5h, filterRange(entries, win.startedAt.getTime(), nowMs));
	}

	const weekly = emptyWindow();
	const sevenDaysAgo = new Date(nowMs - SEVEN_DAYS_MS);
	weekly.startedAt = sevenDaysAgo;
	sumInto(weekly, filterRange(entries, sevenDaysAgo.getTime(), nowMs));

	const allTime = emptyWindow();
	if (entries.length > 0) {
		allTime.startedAt = entries[0].timestamp;
		sumInto(allTime, entries);
	}

	return {
		generatedAt: new Date(now),
		estimated: true,
		today,
		session5h,
		weekly,
		allTime
	};
}

export function sumModelUsages(...usages: readonly ModelUsage[]): ModelUsage {
	const out = emptyModelUsage();
	for (const u of usages) {
		out.inputTokens += u.inputTokens;
		out.outputTokens += u.outputTokens;
		out.cacheReadTokens += u.cacheReadTokens;
		out.cacheCreationTokens += u.cacheCreationTokens;
		out.requests += u.requests;
	}
	return out;
}

export const ALL_MODELS: readonly ModelFamily[] = ["opus", "sonnet", "haiku", "other"];
