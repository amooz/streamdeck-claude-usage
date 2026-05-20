import { describe, expect, it } from "vitest";

import { isSubscriptionTier, SUBSCRIPTION_TIERS, TIER_DEFAULTS, tierDenominator } from "../src/tiers.js";

describe("SUBSCRIPTION_TIERS", () => {
	it("includes every tier referenced by TIER_DEFAULTS and vice versa", () => {
		for (const t of SUBSCRIPTION_TIERS) {
			expect(TIER_DEFAULTS[t]).toBeDefined();
		}
	});
});

describe("isSubscriptionTier", () => {
	it("accepts documented tier strings", () => {
		expect(isSubscriptionTier("max-20x")).toBe(true);
		expect(isSubscriptionTier("pro")).toBe(true);
	});

	it("rejects unknown values", () => {
		expect(isSubscriptionTier("super-max")).toBe(false);
		expect(isSubscriptionTier(42)).toBe(false);
		expect(isSubscriptionTier(undefined)).toBe(false);
	});
});

describe("tierDenominator", () => {
	it("returns the per-model denominator when present", () => {
		expect(tierDenominator("max-20x", "session5h", "opus")).toBe(2_000_000);
		expect(tierDenominator("max-20x", "weekly", "sonnet")).toBe(20_000_000);
	});

	it("falls back to the 'all' default when the model isn't listed", () => {
		expect(tierDenominator("max-20x", "session5h", "other")).toBe(4_000_000);
	});

	it("scales up by tier", () => {
		const pro = tierDenominator("pro", "session5h", "opus");
		const max5 = tierDenominator("max-5x", "session5h", "opus");
		const max20 = tierDenominator("max-20x", "session5h", "opus");
		expect(pro).toBeLessThan(max5!);
		expect(max5).toBeLessThan(max20!);
	});

	it("returns null for tiers without session caps", () => {
		expect(tierDenominator("api-only", "session5h", "opus")).toBeNull();
		expect(tierDenominator("custom", "weekly", "opus")).toBeNull();
	});
});
