import type { ModelFamily } from "./types.js";

export type SubscriptionTier = "custom" | "api-only" | "pro" | "max-5x" | "max-20x";
export const SUBSCRIPTION_TIERS: readonly SubscriptionTier[] = ["custom", "api-only", "pro", "max-5x", "max-20x"];

export type WindowDenominators = {
	session5h: Partial<Record<ModelFamily | "all", number>>;
	weekly: Partial<Record<ModelFamily | "all", number>>;
};

/**
 * Starting-point denominators for the ring renderer when the user picks a
 * subscription tier. These are deliberately round, conservative numbers —
 * Anthropic does not publish exact token caps and changes them periodically.
 * Treat them as defaults to refine, not authoritative limits. Users override
 * via the "Denominator" PI field whenever they want a tighter (or looser) gate.
 *
 * Empty entries mean "no sensible default; require explicit user input." For
 * api-only (no claude.ai subscription) the 5h/weekly windows do not apply
 * and we leave them empty.
 */
export const TIER_DEFAULTS: Record<SubscriptionTier, WindowDenominators> = {
	custom: { session5h: {}, weekly: {} },
	"api-only": { session5h: {}, weekly: {} },
	pro: {
		session5h: { all: 200_000, opus: 100_000, sonnet: 200_000, haiku: 400_000 },
		weekly: { all: 1_000_000, opus: 500_000, sonnet: 1_000_000, haiku: 2_000_000 }
	},
	"max-5x": {
		session5h: { all: 1_000_000, opus: 500_000, sonnet: 1_000_000, haiku: 2_000_000 },
		weekly: { all: 5_000_000, opus: 2_500_000, sonnet: 5_000_000, haiku: 10_000_000 }
	},
	"max-20x": {
		session5h: { all: 4_000_000, opus: 2_000_000, sonnet: 4_000_000, haiku: 8_000_000 },
		weekly: { all: 20_000_000, opus: 10_000_000, sonnet: 20_000_000, haiku: 40_000_000 }
	}
};

export function tierDenominator(
	tier: SubscriptionTier,
	window: "session5h" | "weekly",
	model: ModelFamily | "all"
): number | null {
	const table = TIER_DEFAULTS[tier];
	if (!table) return null;
	const candidates = table[window];
	const value = candidates[model] ?? candidates.all;
	return typeof value === "number" && value > 0 ? value : null;
}

export function isSubscriptionTier(value: unknown): value is SubscriptionTier {
	return typeof value === "string" && (SUBSCRIPTION_TIERS as readonly string[]).includes(value);
}
