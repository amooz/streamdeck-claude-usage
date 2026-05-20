import { isSubscriptionTier, type SubscriptionTier, tierDenominator } from "../tiers.js";
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
	tier?: SubscriptionTier;
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
	tier: SubscriptionTier;
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
	adminApiKey: null,
	tier: "max-20x"
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
	const metric: MetricKey = {
		window: pick(s.metricWindow, WINDOW_KEYS, DEFAULTS.metric.window),
		model:
			s.metricModel === "all" ? "all" : pick(s.metricModel, MODEL_FAMILIES, DEFAULTS.metric.model as ModelFamily),
		field: pick(s.metricField, METRIC_FIELDS, DEFAULTS.metric.field)
	};
	const tier: SubscriptionTier = isSubscriptionTier(s.tier) ? s.tier : DEFAULTS.tier;

	// Explicit user denominator wins; otherwise consult the tier table for
	// session5h / weekly windows. Other windows have no tier-based default.
	let denominator: number | null = DEFAULTS.denominator;
	if (typeof s.denominator === "number" && Number.isFinite(s.denominator) && s.denominator > 0) {
		denominator = s.denominator;
	} else if (metric.window === "session5h" || metric.window === "weekly") {
		denominator = tierDenominator(tier, metric.window, metric.model);
	}

	return {
		displayMode: pick(s.displayMode, DISPLAY_MODES, DEFAULTS.displayMode),
		source: pick(s.source, DATA_SOURCES, DEFAULTS.source),
		project: pickString(s.project, null) ?? DEFAULTS.project,
		projectsRoot: pickString(s.projectsRoot, DEFAULTS.projectsRoot),
		metric,
		denominator,
		label: pickString(s.label, DEFAULTS.label),
		refreshSeconds: pickNumber(s.refreshSeconds, DEFAULTS.refreshSeconds),
		adminApiKey: pickString(s.adminApiKey, DEFAULTS.adminApiKey),
		tier
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
