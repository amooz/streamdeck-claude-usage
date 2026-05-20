import type { ModelFamily } from "../types.js";

export type ParsedAssistantEntry = {
	timestamp: Date;
	sessionId: string;
	model: ModelFamily;
	rawModel: string;
	inputTokens: number;
	outputTokens: number;
	cacheReadTokens: number;
	cacheCreationTokens: number;
};

export function classifyModel(rawModel: string | undefined | null): ModelFamily {
	if (!rawModel) return "other";
	const m = rawModel.toLowerCase();
	if (m.includes("opus")) return "opus";
	if (m.includes("sonnet")) return "sonnet";
	if (m.includes("haiku")) return "haiku";
	return "other";
}

export function parseAssistantLine(line: string): ParsedAssistantEntry | null {
	const trimmed = line.trim();
	if (!trimmed) return null;
	let obj: unknown;
	try {
		obj = JSON.parse(trimmed);
	} catch {
		return null;
	}
	if (!isRecord(obj)) return null;
	if (obj.type !== "assistant") return null;
	const timestamp = parseTimestamp(obj.timestamp);
	if (!timestamp) return null;
	const sessionId = typeof obj.sessionId === "string" ? obj.sessionId : "";
	const message = isRecord(obj.message) ? obj.message : null;
	const rawModel = message && typeof message.model === "string" ? message.model : "";
	const usage = message && isRecord(message.usage) ? message.usage : null;
	if (!usage) return null;
	return {
		timestamp,
		sessionId,
		model: classifyModel(rawModel),
		rawModel,
		inputTokens: numberOr0(usage.input_tokens),
		outputTokens: numberOr0(usage.output_tokens),
		cacheReadTokens: numberOr0(usage.cache_read_input_tokens),
		cacheCreationTokens: numberOr0(usage.cache_creation_input_tokens)
	};
}

export function parseJsonlContents(contents: string): ParsedAssistantEntry[] {
	const out: ParsedAssistantEntry[] = [];
	for (const line of contents.split("\n")) {
		const e = parseAssistantLine(line);
		if (e) out.push(e);
	}
	return out;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseTimestamp(value: unknown): Date | null {
	if (typeof value !== "string") return null;
	const d = new Date(value);
	return Number.isNaN(d.getTime()) ? null : d;
}

function numberOr0(value: unknown): number {
	return typeof value === "number" && Number.isFinite(value) ? value : 0;
}
