import { describe, expect, it } from "vitest";

import { AdminApiClient, AdminApiError, modelFamilyFromBucket } from "../../src/sources/admin-api-client.js";

function jsonResponse(payload: unknown, init: ResponseInit = {}): Response {
	return new Response(JSON.stringify(payload), {
		status: 200,
		headers: { "content-type": "application/json" },
		...init
	});
}

describe("modelFamilyFromBucket", () => {
	it("classifies by the model in group_by", () => {
		expect(modelFamilyFromBucket({ group_by: { model: "claude-opus-4-7" } })).toBe("opus");
		expect(modelFamilyFromBucket({ group_by: { model: "claude-sonnet-4-6" } })).toBe("sonnet");
		expect(modelFamilyFromBucket({})).toBe("other");
	});
});

describe("AdminApiClient.getUsageByModel", () => {
	it("sends the documented headers and URL params", async () => {
		const calls: Array<[string, RequestInit]> = [];
		const fetchImpl: typeof fetch = async (url, init) => {
			calls.push([String(url), init ?? {}]);
			return jsonResponse({ data: [] });
		};
		const client = new AdminApiClient({ apiKey: "sk-ant-admin-test", fetchImpl });
		await client.getUsageByModel(new Date("2026-05-13T00:00:00Z"), new Date("2026-05-20T00:00:00Z"));

		expect(calls).toHaveLength(1);
		const [url, init] = calls[0];
		expect(url).toContain("/v1/organizations/usage_report/messages");
		expect(url).toContain("starting_at=2026-05-13T00%3A00%3A00.000Z");
		expect(url).toContain("ending_at=2026-05-20T00%3A00%3A00.000Z");
		expect(url).toContain("bucket_width=1d");
		expect(url).toContain("group_by%5B%5D=model");
		const headers = init.headers as Record<string, string>;
		expect(headers["x-api-key"]).toBe("sk-ant-admin-test");
		expect(headers["anthropic-version"]).toBe("2023-06-01");
		expect(headers["user-agent"]).toMatch(/streamdeck-claude-usage/);
	});

	it("returns the parsed JSON body on success", async () => {
		const body = {
			data: [
				{
					starting_at: "2026-05-19T00:00:00Z",
					ending_at: "2026-05-20T00:00:00Z",
					results: [{ output_tokens: 100, group_by: { model: "claude-opus-4-7" } }]
				}
			],
			has_more: false
		};
		const fetchImpl: typeof fetch = async () => jsonResponse(body);
		const client = new AdminApiClient({ apiKey: "k", fetchImpl });
		const out = await client.getUsageByModel(new Date(0), new Date(1));
		expect(out.data[0].results[0].output_tokens).toBe(100);
	});

	it("throws AdminApiError when the response is not OK", async () => {
		const fetchImpl: typeof fetch = async () => new Response("nope", { status: 401 });
		const client = new AdminApiClient({ apiKey: "k", fetchImpl });
		await expect(client.getUsageByModel(new Date(0), new Date(1))).rejects.toBeInstanceOf(AdminApiError);
		try {
			await client.getUsageByModel(new Date(0), new Date(1));
		} catch (err) {
			expect(err).toBeInstanceOf(AdminApiError);
			expect((err as AdminApiError).status).toBe(401);
			expect((err as AdminApiError).body).toBe("nope");
		}
	});

	it("honors a custom baseUrl", async () => {
		const urls: string[] = [];
		const fetchImpl: typeof fetch = async (url) => {
			urls.push(String(url));
			return jsonResponse({ data: [] });
		};
		const client = new AdminApiClient({ apiKey: "k", fetchImpl, baseUrl: "https://example.test" });
		await client.getUsageByModel(new Date(0), new Date(1));
		expect(urls[0]).toMatch(/^https:\/\/example\.test/);
	});
});
