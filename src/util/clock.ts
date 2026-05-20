export interface Clock {
	now(): Date;
}

export const systemClock: Clock = {
	now: () => new Date()
};

export function fixedClock(at: Date | string): Clock {
	const d = typeof at === "string" ? new Date(at) : at;
	return { now: () => new Date(d) };
}
