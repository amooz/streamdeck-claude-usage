import { describe, expect, it } from "vitest";

import { BEZEL_INSET, KEY_SIZE } from "../../src/render/renderer.js";

describe("render constants", () => {
	it("targets the 144x144 @2x Stream Deck key surface", () => {
		expect(KEY_SIZE).toBe(144);
	});

	it("reserves a non-zero bezel inset so content stays clear of the shadow", () => {
		expect(BEZEL_INSET).toBeGreaterThan(0);
		expect(BEZEL_INSET).toBeLessThan(KEY_SIZE / 4);
	});
});
