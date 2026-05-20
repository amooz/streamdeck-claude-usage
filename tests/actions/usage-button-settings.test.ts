import { describe, expect, it } from "vitest";

import { DEFAULTS, resolveSettings, toDisplayConfig } from "../../src/actions/usage-button-settings.js";

describe("resolveSettings", () => {
	it("returns default-shaped settings when payload is null or undefined (with tier-table denominator)", () => {
		const r = resolveSettings(null);
		expect(r.displayMode).toBe(DEFAULTS.displayMode);
		expect(r.source).toBe(DEFAULTS.source);
		expect(r.tier).toBe(DEFAULTS.tier);
		expect(r.metric).toEqual(DEFAULTS.metric);
		// Default tier (max-20x) + default metric (session5h opus) -> tier-table denominator.
		expect(r.denominator).toBe(2_000_000);
		expect(resolveSettings(undefined)).toEqual(r);
		expect(resolveSettings({})).toEqual(r);
	});

	it("applies every documented user-settable field", () => {
		const r = resolveSettings({
			displayMode: "ring+text",
			source: "admin-api",
			project: "-home-foo",
			projectsRoot: "/tmp/p",
			metricWindow: "weekly",
			metricModel: "sonnet",
			metricField: "totalTokens",
			denominator: 50000,
			label: "Sonnet weekly",
			refreshSeconds: 30,
			adminApiKey: "sk-ant-admin-x"
		});
		expect(r.displayMode).toBe("ring+text");
		expect(r.source).toBe("admin-api");
		expect(r.project).toBe("-home-foo");
		expect(r.projectsRoot).toBe("/tmp/p");
		expect(r.metric).toEqual({ window: "weekly", model: "sonnet", field: "totalTokens" });
		expect(r.denominator).toBe(50000);
		expect(r.label).toBe("Sonnet weekly");
		expect(r.refreshSeconds).toBe(30);
		expect(r.adminApiKey).toBe("sk-ant-admin-x");
	});

	it("supports the 'all' model aggregate", () => {
		const r = resolveSettings({ metricModel: "all" });
		expect(r.metric.model).toBe("all");
	});

	it("rejects unknown values and falls back to defaults", () => {
		const r = resolveSettings({
			displayMode: "neon" as unknown as "text",
			source: "psychic" as unknown as "local-logs",
			metricWindow: "yesterday" as unknown as "today",
			metricModel: "gpt" as unknown as "opus",
			metricField: "vibes" as unknown as "outputTokens",
			refreshSeconds: -5,
			denominator: -10,
			tier: "custom"
		});
		expect(r.displayMode).toBe(DEFAULTS.displayMode);
		expect(r.source).toBe(DEFAULTS.source);
		expect(r.metric).toEqual(DEFAULTS.metric);
		expect(r.refreshSeconds).toBe(DEFAULTS.refreshSeconds);
		// 'custom' tier has no defaults, so an invalid explicit denominator falls back to null.
		expect(r.denominator).toBeNull();
	});

	it("treats empty strings as missing", () => {
		const r = resolveSettings({ project: "", label: "", adminApiKey: "", projectsRoot: "" });
		expect(r.project).toBe("all");
		expect(r.label).toBeNull();
		expect(r.adminApiKey).toBeNull();
		expect(r.projectsRoot).toBeNull();
	});
});

describe("tier-driven denominator", () => {
	it("auto-fills denominator from the tier table when none is provided", () => {
		const r = resolveSettings({
			tier: "max-20x",
			metricWindow: "session5h",
			metricModel: "opus"
		});
		expect(r.denominator).toBe(2_000_000);
	});

	it("prefers an explicit user denominator over the tier table", () => {
		const r = resolveSettings({
			tier: "max-20x",
			metricWindow: "session5h",
			metricModel: "opus",
			denominator: 999
		});
		expect(r.denominator).toBe(999);
	});

	it("leaves denominator null for windows without tier defaults", () => {
		const r = resolveSettings({ tier: "max-20x", metricWindow: "today" });
		expect(r.denominator).toBeNull();
	});

	it("leaves denominator null for tiers without session caps", () => {
		const r = resolveSettings({ tier: "api-only", metricWindow: "session5h", metricModel: "opus" });
		expect(r.denominator).toBeNull();
	});
});

describe("toDisplayConfig", () => {
	it("projects the resolved settings down to the renderer surface", () => {
		const r = resolveSettings({ displayMode: "ring", denominator: 1000, label: "x" });
		const d = toDisplayConfig(r);
		expect(d).toEqual({
			mode: "ring",
			metric: DEFAULTS.metric,
			denominator: 1000,
			label: "x"
		});
	});
});
