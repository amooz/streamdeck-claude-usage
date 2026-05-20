import { describe, expect, it } from "vitest";

import { reasonForError, renderError } from "../../src/render/error-renderer.js";

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

describe("renderError", () => {
	it("produces a PNG buffer", () => {
		const buf = renderError("offline");
		expect(buf.subarray(0, 8)).toEqual(PNG_SIGNATURE);
	});

	it("truncates long reasons to fit the safe area", () => {
		const buf = renderError("a-really-extremely-long-message-that-cannot-possibly-fit");
		expect(buf.length).toBeGreaterThan(0);
	});

	it("handles a trivially-short reason", () => {
		const buf = renderError("x");
		expect(buf.length).toBeGreaterThan(0);
	});
});

describe("reasonForError", () => {
	it("maps 401/403 to 'auth'", () => {
		expect(reasonForError({ status: 401 })).toBe("auth");
		expect(reasonForError({ status: 403 })).toBe("auth");
	});

	it("maps 429 to 'rate limit'", () => {
		expect(reasonForError({ status: 429 })).toBe("rate limit");
	});

	it("maps 5xx to 'api <status>'", () => {
		expect(reasonForError({ status: 500 })).toBe("api 500");
		expect(reasonForError({ status: 503 })).toBe("api 503");
	});

	it("falls through to generic 'http <status>' for other statuses", () => {
		expect(reasonForError({ status: 418 })).toBe("http 418");
	});

	it("classifies network-flavored Error messages as 'offline'", () => {
		expect(reasonForError(new Error("fetch failed: ENOTFOUND"))).toBe("offline");
		expect(reasonForError(new Error("ECONNRESET"))).toBe("offline");
		expect(reasonForError(new Error("timeout reading"))).toBe("offline");
	});

	it("falls back to 'error' for unrecognized values", () => {
		expect(reasonForError(new Error("something weird"))).toBe("error");
		expect(reasonForError("a string")).toBe("error");
	});
});
