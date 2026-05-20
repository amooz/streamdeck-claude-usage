import { describe, expect, it } from "vitest";

import { classifyModel, parseAssistantLine, parseJsonlContents } from "../../src/sources/jsonl-parser.js";

describe("classifyModel", () => {
	it("classifies Claude model strings into families", () => {
		expect(classifyModel("claude-opus-4-7")).toBe("opus");
		expect(classifyModel("claude-sonnet-4-6")).toBe("sonnet");
		expect(classifyModel("claude-haiku-4-5-20251001")).toBe("haiku");
	});

	it("returns 'other' for empty or unknown model strings", () => {
		expect(classifyModel("")).toBe("other");
		expect(classifyModel(null)).toBe("other");
		expect(classifyModel(undefined)).toBe("other");
		expect(classifyModel("gpt-4")).toBe("other");
	});
});

describe("parseAssistantLine", () => {
	const valid = JSON.stringify({
		type: "assistant",
		timestamp: "2026-05-14T14:48:07.588Z",
		sessionId: "abc",
		message: {
			model: "claude-opus-4-7",
			usage: {
				input_tokens: 6,
				output_tokens: 186,
				cache_read_input_tokens: 17029,
				cache_creation_input_tokens: 10196
			}
		}
	});

	it("parses a well-formed assistant entry", () => {
		const e = parseAssistantLine(valid);
		expect(e).not.toBeNull();
		expect(e!.timestamp.toISOString()).toBe("2026-05-14T14:48:07.588Z");
		expect(e!.sessionId).toBe("abc");
		expect(e!.model).toBe("opus");
		expect(e!.rawModel).toBe("claude-opus-4-7");
		expect(e!.inputTokens).toBe(6);
		expect(e!.outputTokens).toBe(186);
		expect(e!.cacheReadTokens).toBe(17029);
		expect(e!.cacheCreationTokens).toBe(10196);
	});

	it("returns null for empty or whitespace lines", () => {
		expect(parseAssistantLine("")).toBeNull();
		expect(parseAssistantLine("   ")).toBeNull();
	});

	it("returns null for invalid JSON", () => {
		expect(parseAssistantLine("{not json")).toBeNull();
	});

	it("returns null for non-assistant entries", () => {
		expect(parseAssistantLine(JSON.stringify({ type: "user", timestamp: "2026-05-14T00:00:00Z" }))).toBeNull();
	});

	it("returns null when usage is missing", () => {
		expect(
			parseAssistantLine(
				JSON.stringify({
					type: "assistant",
					timestamp: "2026-05-14T00:00:00Z",
					message: { model: "claude-opus-4-7" }
				})
			)
		).toBeNull();
	});

	it("returns null when timestamp is missing or unparseable", () => {
		expect(parseAssistantLine(JSON.stringify({ type: "assistant", message: { usage: {} } }))).toBeNull();
		expect(
			parseAssistantLine(JSON.stringify({ type: "assistant", timestamp: "garbage", message: { usage: {} } }))
		).toBeNull();
	});

	it("treats missing token fields as 0 rather than erroring", () => {
		const e = parseAssistantLine(
			JSON.stringify({
				type: "assistant",
				timestamp: "2026-05-14T00:00:00Z",
				message: { model: "claude-sonnet-4-6", usage: {} }
			})
		);
		expect(e).not.toBeNull();
		expect(e!.inputTokens).toBe(0);
		expect(e!.outputTokens).toBe(0);
		expect(e!.cacheReadTokens).toBe(0);
		expect(e!.cacheCreationTokens).toBe(0);
	});

	it("rejects non-object JSON payloads", () => {
		expect(parseAssistantLine("[]")).toBeNull();
		expect(parseAssistantLine("42")).toBeNull();
		expect(parseAssistantLine("null")).toBeNull();
	});

	it("ignores non-finite numeric usage fields", () => {
		const e = parseAssistantLine(
			JSON.stringify({
				type: "assistant",
				timestamp: "2026-05-14T00:00:00Z",
				message: { model: "claude-opus-4-7", usage: { input_tokens: "lots", output_tokens: 5 } }
			})
		);
		expect(e!.inputTokens).toBe(0);
		expect(e!.outputTokens).toBe(5);
	});
});

describe("parseJsonlContents", () => {
	it("filters out garbage and non-assistant lines", () => {
		const contents = [
			"",
			"{not json",
			JSON.stringify({ type: "user", timestamp: "2026-05-14T00:00:00Z" }),
			JSON.stringify({
				type: "assistant",
				timestamp: "2026-05-14T01:00:00Z",
				message: { model: "claude-haiku-4-5-20251001", usage: { output_tokens: 1 } }
			})
		].join("\n");
		const out = parseJsonlContents(contents);
		expect(out).toHaveLength(1);
		expect(out[0].model).toBe("haiku");
	});
});
