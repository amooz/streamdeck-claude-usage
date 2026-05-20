export type ModelFamily = "opus" | "sonnet" | "haiku" | "other";

export const MODEL_FAMILIES: readonly ModelFamily[] = ["opus", "sonnet", "haiku", "other"] as const;

export type ModelUsage = {
	inputTokens: number;
	outputTokens: number;
	cacheReadTokens: number;
	cacheCreationTokens: number;
	requests: number;
};

export type WindowUsage = {
	startedAt: Date | null;
	total: ModelUsage;
	byModel: Record<ModelFamily, ModelUsage>;
};

export type UsageSnapshot = {
	generatedAt: Date;
	estimated: boolean;
	today: WindowUsage;
	session5h: WindowUsage;
	weekly: WindowUsage;
	allTime: WindowUsage;
};

export type DisplayMode = "text" | "ring" | "ring+text";
export const DISPLAY_MODES: readonly DisplayMode[] = ["text", "ring", "ring+text"] as const;

export type WindowKey = "today" | "session5h" | "weekly" | "allTime";
export const WINDOW_KEYS: readonly WindowKey[] = ["today", "session5h", "weekly", "allTime"] as const;

export type MetricField =
	| "inputTokens"
	| "outputTokens"
	| "totalTokens"
	| "cacheReadTokens"
	| "cacheCreationTokens"
	| "requests";

export const METRIC_FIELDS: readonly MetricField[] = [
	"inputTokens",
	"outputTokens",
	"totalTokens",
	"cacheReadTokens",
	"cacheCreationTokens",
	"requests"
] as const;

export type MetricKey = {
	window: WindowKey;
	model: ModelFamily | "all";
	field: MetricField;
};

export type DisplayConfig = {
	mode: DisplayMode;
	metric: MetricKey;
	denominator: number | null;
	label: string | null;
};

export function emptyModelUsage(): ModelUsage {
	return {
		inputTokens: 0,
		outputTokens: 0,
		cacheReadTokens: 0,
		cacheCreationTokens: 0,
		requests: 0
	};
}

export function emptyWindow(): WindowUsage {
	const byModel = {} as Record<ModelFamily, ModelUsage>;
	for (const m of MODEL_FAMILIES) byModel[m] = emptyModelUsage();
	return { startedAt: null, total: emptyModelUsage(), byModel };
}

export function readMetric(snapshot: UsageSnapshot, metric: MetricKey): number {
	const win = snapshot[metric.window];
	const usage = metric.model === "all" ? win.total : win.byModel[metric.model];
	if (metric.field === "totalTokens") {
		return usage.inputTokens + usage.outputTokens + usage.cacheReadTokens + usage.cacheCreationTokens;
	}
	return usage[metric.field];
}
