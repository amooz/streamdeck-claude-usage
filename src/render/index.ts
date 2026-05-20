import type { DisplayConfig, DisplayMode, UsageSnapshot } from "../types.js";
import { type Renderer } from "./renderer.js";
import { TextRenderer } from "./text-renderer.js";

const renderers: Record<DisplayMode, Renderer> = {
	text: new TextRenderer(),
	// Ring + composite renderers land in Phase E; until then they fall back to text
	// so a misconfigured button still shows something useful rather than going blank.
	ring: new TextRenderer(),
	"ring+text": new TextRenderer()
};

export function rendererFor(mode: DisplayMode): Renderer {
	return renderers[mode] ?? renderers.text;
}

export function registerRenderer(mode: DisplayMode, renderer: Renderer): void {
	renderers[mode] = renderer;
}

export function renderButton(snapshot: UsageSnapshot, display: DisplayConfig): Buffer {
	return rendererFor(display.mode).render(snapshot, display);
}
