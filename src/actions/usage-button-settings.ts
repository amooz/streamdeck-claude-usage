import type { DisplayConfig, DisplayMode, MetricField, MetricKey, ModelFamily, WindowKey } from "../types.js";
import { DISPLAY_MODES, METRIC_FIELDS, MODEL_FAMILIES, WINDOW_KEYS } from "../types.js";

export type DataSource = "admin-api" | "local-logs";
export const DATA_SOURCES: readonly DataSource[] = ["admin-api", "local-logs"] as const;

/**
 * Persisted per-button settings. Every field is optional so the action can
 * recover from a partial / first-time payload; resolveSettings fills in
 * sensible defaults.
 */
export type UsageButtonSettings = {
	displayMode?: DisplayMode;
	source?: DataSource;
	project?: string;
	projectsRoot?: string;
	metricWindow?: WindowKey;
	metricModel?: ModelFamily | "all";
	metricField?: MetricField;
	denominator?: number | null;
	label?: string | null;
	refreshSeconds?: number;
	adminApiKey?: string;
};

export type ResolvedSettings = {
	displayMode: DisplayMode;
	source: DataSource;
	project: string;
	projectsRoot: string | null;
	metric: MetricKey;
	denominator: number | null;
	label: string | null;
	refreshSeconds: number;
	adminApiKey: string | null;
};

export const DEFAULTS: ResolvedSettings = {
	displayMode: "text",
	source: "local-logs",
	project: "all",
	projectsRoot: null,
	metric: { window: "session5h", model: "opus", field: "outputTokens" },
	denominator: null,
	label: null,
	refreshSeconds: 60,
	adminApiKey: null
};

function pick<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
	return typeof value === "string" && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

function pickNumber(value: unknown, fallback: number, min = 1): number {
	return typeof value === "number" && Number.isFinite(value) && value >= min ? value : fallback;
}

function pickString(value: unknown, fallback: string | null): string | null {
	return typeof value === "string" && value.length > 0 ? value : fallback;
}

export function resolveSettings(raw: UsageButtonSettings | undefined | null): ResolvedSettings {
	const s = raw ?? {};
	return {
		displayMode: pick(s.displayMode, DISPLAY_MODES, DEFAULTS.displayMode),
		source: pick(s.source, DATA_SOURCES, DEFAULTS.source),
		project: pickString(s.project, null) ?? DEFAULTS.project,
		projectsRoot: pickString(s.projectsRoot, DEFAULTS.projectsRoot),
		metric: {
			window: pick(s.metricWindow, WINDOW_KEYS, DEFAULTS.metric.window),
			model:
				s.metricModel === "all"
					? "all"
					: pick(s.metricModel, MODEL_FAMILIES, DEFAULTS.metric.model as ModelFamily),
			field: pick(s.metricField, METRIC_FIELDS, DEFAULTS.metric.field)
		},
		denominator:
			typeof s.denominator === "number" && Number.isFinite(s.denominator) && s.denominator > 0
				? s.denominator
				: DEFAULTS.denominator,
		label: pickString(s.label, DEFAULTS.label),
		refreshSeconds: pickNumber(s.refreshSeconds, DEFAULTS.refreshSeconds),
		adminApiKey: pickString(s.adminApiKey, DEFAULTS.adminApiKey)
	};
}

export function toDisplayConfig(s: ResolvedSettings): DisplayConfig {
	return {
		mode: s.displayMode,
		metric: s.metric,
		denominator: s.denominator,
		label: s.label
	};
}
