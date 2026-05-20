import type { DisplayConfig, MetricKey, UsageSnapshot } from "../types.js";
import { readMetric } from "../types.js";
import { formatCompact, formatPercent } from "./format.js";

const WINDOW_LABEL: Record<MetricKey["window"], string> = {
	today: "Today",
	session5h: "5h",
	weekly: "Week",
	allTime: "All"
};

const MODEL_LABEL: Record<MetricKey["model"], string> = {
	opus: "Opus",
	sonnet: "Sonnet",
	haiku: "Haiku",
	other: "Other",
	all: ""
};

const FIELD_LABEL: Record<MetricKey["field"], string> = {
	inputTokens: "in",
	outputTokens: "out",
	totalTokens: "tok",
	cacheReadTokens: "cR",
	cacheCreationTokens: "cW",
	requests: "req"
};

export function defaultLabel(metric: MetricKey): string {
	const parts = [MODEL_LABEL[metric.model], WINDOW_LABEL[metric.window]].filter(Boolean);
	const head = parts.join(" ");
	return head ? `${head} ${FIELD_LABEL[metric.field]}` : FIELD_LABEL[metric.field];
}

export function labelFor(display: DisplayConfig): string {
	return display.label ?? defaultLabel(display.metric);
}

/**
 * Returns the value as it should appear on the button, including a leading
 * "~" for estimated data and a trailing "%" if a denominator is configured.
 */
export function formatValue(snapshot: UsageSnapshot, display: DisplayConfig): string {
	const raw = readMetric(snapshot, display.metric);
	const body =
		display.denominator && display.denominator > 0 ? formatPercent(raw / display.denominator) : formatCompact(raw);
	return snapshot.estimated ? `~${body}` : body;
}
