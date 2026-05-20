import { describe, expect, it } from "vitest";

import { DISPLAY_MODES, isDisplayMode, type UsageButtonSettings } from "../src/actions/usage-button-settings.js";

describe("UsageButton settings", () => {
	it("exposes the three documented display modes", () => {
		expect(DISPLAY_MODES).toEqual(["text", "ring", "ring+text"]);
	});

	it("isDisplayMode accepts the three documented modes", () => {
		for (const mode of DISPLAY_MODES) {
			expect(isDisplayMode(mode)).toBe(true);
		}
	});

	it("isDisplayMode rejects unknown values", () => {
		expect(isDisplayMode("graph")).toBe(false);
		expect(isDisplayMode(undefined)).toBe(false);
		expect(isDisplayMode(42)).toBe(false);
	});

	it("settings type allows partial configuration", () => {
		const settings: UsageButtonSettings = { displayMode: "ring+text" };
		expect(settings.displayMode).toBe("ring+text");
	});
});
