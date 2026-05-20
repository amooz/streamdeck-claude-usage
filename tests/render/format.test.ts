import { describe, expect, it } from "vitest";

import { formatCompact, formatPercent } from "../../src/render/format.js";

describe("formatCompact", () => {
	it("renders values under 1000 as integers", () => {
		expect(formatCompact(0)).toBe("0");
		expect(formatCompact(42)).toBe("42");
		expect(formatCompact(999)).toBe("999");
	});

	it("renders thousands with a single-decimal k suffix", () => {
		expect(formatCompact(1000)).toBe("1k");
		expect(formatCompact(1234)).toBe("1.2k");
		expect(formatCompact(35600)).toBe("35.6k");
	});

	it("renders millions with a single-decimal M suffix", () => {
		expect(formatCompact(1_500_000)).toBe("1.5M");
		expect(formatCompact(20_000_000)).toBe("20M");
	});

	it("renders billions with a single-decimal G suffix", () => {
		expect(formatCompact(2_500_000_000)).toBe("2.5G");
	});

	it("falls back to an em-dash for non-finite values", () => {
		expect(formatCompact(NaN)).toBe("—");
		expect(formatCompact(Infinity)).toBe("—");
	});

	it("renders negatives consistently", () => {
		expect(formatCompact(-2500)).toBe("-2.5k");
	});
});

describe("formatPercent", () => {
	it("rounds to integer percent", () => {
		expect(formatPercent(0)).toBe("0%");
		expect(formatPercent(0.456)).toBe("46%");
		expect(formatPercent(1)).toBe("100%");
	});

	it("clamps to [0,1]", () => {
		expect(formatPercent(-0.5)).toBe("0%");
		expect(formatPercent(1.5)).toBe("100%");
	});

	it("falls back to em-dash for non-finite", () => {
		expect(formatPercent(NaN)).toBe("—");
	});
});
