import type { DisplayConfig, DisplayMode, UsageSnapshot } from "../types.js";
import { CompositeRenderer } from "./composite-renderer.js";
import { type Renderer } from "./renderer.js";
import { RingRenderer } from "./ring-renderer.js";
import { TextRenderer } from "./text-renderer.js";

const renderers: Record<DisplayMode, Renderer> = {
	text: new TextRenderer(),
	ring: new RingRenderer(),
	"ring+text": new CompositeRenderer()
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
