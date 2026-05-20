/**
 * Compact human-readable number for tiny button surfaces.
 *   42 → "42"
 *   1234 → "1.2k"
 *   1500000 → "1.5M"
 *   2_500_000_000 → "2.5G"
 */
export function formatCompact(value: number): string {
	if (!Number.isFinite(value)) return "—";
	const abs = Math.abs(value);
	if (abs < 1000) return Math.round(value).toString();
	if (abs < 1_000_000) return trim(value / 1000) + "k";
	if (abs < 1_000_000_000) return trim(value / 1_000_000) + "M";
	return trim(value / 1_000_000_000) + "G";
}

/**
 * Percent rendered as integer (matches Stream Deck-style buttons).
 *   0 → "0%"; 0.456 → "46%"; 1 → "100%".
 */
export function formatPercent(fraction: number): string {
	if (!Number.isFinite(fraction)) return "—";
	const clamped = Math.max(0, Math.min(1, fraction));
	return `${Math.round(clamped * 100)}%`;
}

function trim(n: number): string {
	const rounded = Math.round(n * 10) / 10;
	return rounded.toFixed(1).replace(/\.0$/, "");
}
