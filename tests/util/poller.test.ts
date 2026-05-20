import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Poller } from "../../src/util/poller.js";

describe("Poller", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("runs the task immediately on start", () => {
		const task = vi.fn(async () => {});
		const p = new Poller(task, { intervalMs: 1000 });
		p.start();
		expect(task).toHaveBeenCalledTimes(1);
		p.stop();
	});

	it("runs the task again after each interval", async () => {
		const task = vi.fn(async () => {});
		const p = new Poller(task, { intervalMs: 1000 });
		p.start();
		await vi.advanceTimersByTimeAsync(1000);
		await vi.advanceTimersByTimeAsync(1000);
		expect(task).toHaveBeenCalledTimes(3);
		p.stop();
	});

	it("stop() halts further ticks", async () => {
		const task = vi.fn(async () => {});
		const p = new Poller(task, { intervalMs: 1000 });
		p.start();
		p.stop();
		await vi.advanceTimersByTimeAsync(5000);
		expect(task).toHaveBeenCalledTimes(1);
	});

	it("start() is a no-op when already running", () => {
		const task = vi.fn(async () => {});
		const p = new Poller(task, { intervalMs: 1000 });
		p.start();
		p.start();
		expect(task).toHaveBeenCalledTimes(1);
		p.stop();
	});

	it("forwards task errors to onError without stopping the poller", async () => {
		const onError = vi.fn();
		let calls = 0;
		const task = async (): Promise<void> => {
			calls++;
			throw new Error("boom");
		};
		const p = new Poller(task, { intervalMs: 1000, onError });
		p.start();
		await Promise.resolve();
		await Promise.resolve();
		await vi.advanceTimersByTimeAsync(1000);
		expect(onError).toHaveBeenCalledTimes(2);
		expect(calls).toBe(2);
		p.stop();
	});

	it("drops overlapping ticks instead of queueing them", async () => {
		let inFlight = 0;
		let maxInFlight = 0;
		const task = async (): Promise<void> => {
			inFlight++;
			if (inFlight > maxInFlight) maxInFlight = inFlight;
			await new Promise((res) => setTimeout(res, 5000));
			inFlight--;
		};
		const p = new Poller(task, { intervalMs: 1000 });
		p.start();
		await vi.advanceTimersByTimeAsync(500);
		await vi.advanceTimersByTimeAsync(1000);
		await vi.advanceTimersByTimeAsync(1000);
		expect(maxInFlight).toBe(1);
		p.stop();
		await vi.runAllTimersAsync();
	});

	it("exposes isRunning", () => {
		const p = new Poller(async () => {}, { intervalMs: 1000 });
		expect(p.isRunning).toBe(false);
		p.start();
		expect(p.isRunning).toBe(true);
		p.stop();
		expect(p.isRunning).toBe(false);
	});

	it("stop() is a no-op when not running", () => {
		const p = new Poller(async () => {}, { intervalMs: 1000 });
		expect(() => p.stop()).not.toThrow();
	});
});
