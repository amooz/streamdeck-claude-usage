import type { DisplayConfig, UsageSnapshot } from "../types.js";

export interface Renderer {
	readonly mode: DisplayConfig["mode"];
	render(snapshot: UsageSnapshot, display: DisplayConfig): Buffer;
}

export const KEY_SIZE = 144;
export const BEZEL_INSET = 8;
