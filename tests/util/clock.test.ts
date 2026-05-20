import { describe, expect, it } from "vitest";

import { fixedClock, systemClock } from "../../src/util/clock.js";

describe("systemClock", () => {
	it("returns a Date close to the wall clock", () => {
		const before = Date.now();
		const t = systemClock.now().getTime();
		const after = Date.now();
		expect(t).toBeGreaterThanOrEqual(before);
		expect(t).toBeLessThanOrEqual(after);
	});
});

describe("fixedClock", () => {
	it("accepts an ISO string", () => {
		const c = fixedClock("2026-05-20T12:00:00Z");
		expect(c.now().toISOString()).toBe("2026-05-20T12:00:00.000Z");
		expect(c.now().toISOString()).toBe("2026-05-20T12:00:00.000Z");
	});

	it("accepts a Date instance", () => {
		const d = new Date("2026-01-01T00:00:00Z");
		const c = fixedClock(d);
		expect(c.now().toISOString()).toBe("2026-01-01T00:00:00.000Z");
	});

	it("isolates callers from one another (does not return the same instance)", () => {
		const c = fixedClock("2026-05-20T12:00:00Z");
		const a = c.now();
		const b = c.now();
		expect(a).not.toBe(b);
		a.setHours(0);
		expect(c.now().toISOString()).toBe("2026-05-20T12:00:00.000Z");
	});
});
