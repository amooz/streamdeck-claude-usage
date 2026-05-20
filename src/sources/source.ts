import type { UsageSnapshot } from "../types.js";

export interface UsageSource {
	readonly id: string;
	fetch(): Promise<UsageSnapshot>;
}
