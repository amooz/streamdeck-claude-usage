import { classifyModel } from "./jsonl-parser.js";
import type { ModelFamily } from "../types.js";

const ANTHROPIC_BASE = "https://api.anthropic.com";
const ANTHROPIC_VERSION = "2023-06-01";
const USER_AGENT = "streamdeck-claude-usage/0.1 (https://github.com/amooz/streamdeck-claude-usage)";

export type AdminApiBucket = {
	starting_at: string;
	ending_at: string;
	results: AdminApiResult[];
};

export type AdminApiResult = {
	uncached_input_tokens?: number;
	cache_read_input_tokens?: number;
	cache_creation_input_tokens?: number;
	output_tokens?: number;
	server_tool_use?: { web_search_requests?: number; web_fetch_requests?: number };
	group_by?: { model?: string };
};

export type UsageReportResponse = {
	data: AdminApiBucket[];
	has_more?: boolean;
	next_page?: string | null;
};

export type AdminApiClientOptions = {
	apiKey: string;
	baseUrl?: string;
	fetchImpl?: typeof fetch;
};

export class AdminApiError extends Error {
	constructor(
		message: string,
		readonly status: number,
		readonly body: string
	) {
		super(message);
		this.name = "AdminApiError";
	}
}

export class AdminApiClient {
	private readonly apiKey: string;
	private readonly baseUrl: string;
	private readonly fetchImpl: typeof fetch;

	constructor(opts: AdminApiClientOptions) {
		this.apiKey = opts.apiKey;
		this.baseUrl = opts.baseUrl ?? ANTHROPIC_BASE;
		this.fetchImpl = opts.fetchImpl ?? fetch;
	}

	async getUsageByModel(startingAt: Date, endingAt: Date): Promise<UsageReportResponse> {
		const params = new URLSearchParams();
		params.set("starting_at", startingAt.toISOString());
		params.set("ending_at", endingAt.toISOString());
		params.set("bucket_width", "1d");
		params.append("group_by[]", "model");
		const url = `${this.baseUrl}/v1/organizations/usage_report/messages?${params.toString()}`;

		const res = await this.fetchImpl(url, {
			method: "GET",
			headers: {
				"x-api-key": this.apiKey,
				"anthropic-version": ANTHROPIC_VERSION,
				"user-agent": USER_AGENT
			}
		});
		if (!res.ok) {
			const body = await res.text();
			throw new AdminApiError(`Admin API request failed: HTTP ${res.status}`, res.status, body);
		}
		return (await res.json()) as UsageReportResponse;
	}
}

export function modelFamilyFromBucket(result: AdminApiResult): ModelFamily {
	return classifyModel(result.group_by?.model);
}
