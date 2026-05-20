export type PollerOptions = {
	intervalMs: number;
	onError?: (err: unknown) => void;
};

/**
 * Tiny self-contained poller. Calls `task` immediately on start, then every
 * `intervalMs` until stopped. Skips overlapping invocations: if the previous
 * task is still in flight when the timer fires, the tick is dropped rather
 * than queued, so a stuck `fetch` can't pile up callbacks.
 */
export class Poller {
	private timer: ReturnType<typeof setInterval> | null = null;
	private inflight = false;

	constructor(
		private readonly task: () => Promise<void>,
		private readonly options: PollerOptions
	) {}

	start(): void {
		if (this.timer !== null) return;
		void this.tick();
		this.timer = setInterval(() => void this.tick(), this.options.intervalMs);
	}

	stop(): void {
		if (this.timer !== null) {
			clearInterval(this.timer);
			this.timer = null;
		}
	}

	get isRunning(): boolean {
		return this.timer !== null;
	}

	private async tick(): Promise<void> {
		if (this.inflight) return;
		this.inflight = true;
		try {
			await this.task();
		} catch (err) {
			this.options.onError?.(err);
		} finally {
			this.inflight = false;
		}
	}
}
